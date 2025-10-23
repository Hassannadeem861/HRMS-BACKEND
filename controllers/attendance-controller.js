import Attendance from "../models/attendance-model.js";
import Holiday from "../models/holiday-model.js";
import Employee from "../models/employer-model.js";
import Leave from "../models/leave-model.js";
import Remote from "../models/remote-model.js";
import ManageOfficeTime from "../models/manage-office-time-model.js";
import officeLoan from "../models/office-loan-model.js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
// import dayjs from "dayjs";
import { parse, differenceInMinutes, set } from "date-fns";
import moment from "moment-timezone";

const uploadAttendanceExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "❌ Please upload an Excel file" });
    }
    // console.log(req.file);

    // const filePath = path.join("public/uploads", req.file.filename);
    // ✅ VERCEL FIX: Use buffer instead of file path
    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true, // ✅ Better date handling
      cellStyles: true,
    });
    // const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData || sheetData.length === 0) {
      return res.status(400).json({ message: "❌ Excel file is empty" });
    }

    const attendanceRecords = [];

    for (const row of sheetData) {
      const rawStatus = row["Status"]?.toString().trim();
      const status =
        rawStatus === "C/In" ? "In" : rawStatus === "C/Out" ? "Out" : "";

      const rawDateTime = row["Date/Time"];
      let dateTime = null;

      // ✅ Excel ke format (M/D/YYYY H:MM:SS AM/PM) ke hisaab se parse
      if (typeof rawDateTime === "number") {
        // Excel serial number format
        dateTime = new Date(Math.round((rawDateTime - 25569) * 86400 * 1000));
      } else if (typeof rawDateTime === "string" && rawDateTime.trim() !== "") {
        const parsed = parse(rawDateTime, "M/d/yyyy h:mm:ss a", new Date());
        if (!isNaN(parsed)) {
          dateTime = parsed;
        } else {
          console.log("❌ Could not parse:", rawDateTime);
        }
      }

      // ✅ Fix: format date as yyyy-mm-dd
      const formattedDateTime = dateTime ? dateTime.toISOString() : null;
      const isSunday = dateTime ? dateTime.getDay() === 0 : false;

      // console.log(rawDateTime, formattedDateTime)

      const record = {
        department: row["Department"] || "",
        name: row["Name"] || "",
        empNo: row["No."] ? row["No."].toString() : "",
        date: formattedDateTime, // ✅ final consistent date
        status,
        isSunday,
        isHoliday: false,
        isLeave: false,
        rawDateTime,
        created_at: new Date(),
      };

      attendanceRecords.push(record);
    }

    // ✅ Sunday insert loop (same)
    const allDates = attendanceRecords
      .map((r) => new Date(r.date))
      .filter(Boolean);

    if (allDates.length > 0) {
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));

      if (maxDate.getDay() !== 0) {
        const daysToAdd = 7 - maxDate.getDay();
        maxDate.setDate(maxDate.getDate() + daysToAdd);
      }

      let checkDate = new Date(minDate);
      while (checkDate <= maxDate) {
        if (checkDate.getDay() === 0) {
          const dateOnly = checkDate.toISOString().split("T")[0];
          const alreadyExists = attendanceRecords.some(
            (r) => r.date === dateOnly
          );

          if (!alreadyExists) {
            attendanceRecords.push({
              department: "Development",
              date: dateOnly,
              status: "Off",
              isSunday: true,
              isHoliday: false,
              rawDateTime: null,
              created_at: new Date(),
            });
          }
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
    }

    await Attendance.insertMany(attendanceRecords);
    // fs.unlinkSync(filePath);

    return res.status(201).json({
      success: true,
      message: "✅ Attendance uploaded successfully",
      recordsInserted: attendanceRecords.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error uploading attendance",
      error: error.message,
    });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().lean();
    const holidays = await Holiday.find().lean();
    const leaves = await Leave.find().lean();

    const holidayDates = holidays.map((h) =>
      new Date(h.date).toLocaleDateString("en-CA")
    );

    // ✅ Leaves ko map me convert kar lo fast lookup ke liye
    const leaveMap = {};
    leaves.forEach((l) => {
      const dateOnly = new Date(l.date).toLocaleDateString("en-CA");
      const key = `${l.empNo}_${dateOnly}`;
      leaveMap[key] = true;
    });

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "✅ Attendance not found",
        records: [],
      });
    }

    const grouped = {};
    for (const rec of records) {
      const emp = rec.empNo;
      const dateOnly = new Date(rec.date).toISOString().split("T")[0];
      const key = `${emp}_${dateOnly}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(rec);
    }

    const processedRecords = [];

    for (const key in grouped) {
      const dayRecords = grouped[key];

      const checkIns = dayRecords.filter((r) => r.status === "In");

      const checkOuts = dayRecords.filter((r) => r.status === "Out");

      let doubleCheckIn = checkIns.length;

      let doubleCheckOut = checkOuts.length;

      let status = "On Time";
      let lateBy = null;

      const currentDate = new Date(dayRecords[0].date);
      const dateOnly = currentDate.toISOString().split("T")[0];

      const empNo = dayRecords[0].empNo;

      const leaveKey = `${empNo}_${dateOnly}`;

      const isSunday = currentDate.getDay() === 0;
      const isHoliday = holidayDates.includes(dateOnly);
      const isLeave = leaveMap[leaveKey] || false;

      if (isSunday) {
        status = "Off";
      } else if (isHoliday) {
        status = "Holiday";
      } else if (isLeave) {
        status = "Leave";
        doubleCheckIn = 0;
        doubleCheckOut = 0;
      } else if (checkIns.length === 0) {
        status = "Absent";
      } else if (checkIns.length === 0 && checkOuts.length === 0) {
        status = "Absent";
      } else if (checkIns.length > 0) {
        const sortedIn = checkIns.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        const firstIn = new Date(sortedIn[0].date);

        const target = set(new Date(firstIn), {
          // 12:15 PM
          hours: 12,
          minutes: 15,
          seconds: 0,
          milliseconds: 0,
        });

        if (firstIn > target) {
          status = "Late";
          const minutesLate = differenceInMinutes(firstIn, target);
          const hours = Math.floor(minutesLate / 60);
          const mins = minutesLate % 60;
          lateBy = `${hours > 0 ? hours + "h " : ""}${mins}m`;
        }
      }

      dayRecords.forEach((rec) => {
        processedRecords.push({
          ...rec,
          checkInCount: doubleCheckIn,
          checkOutCount: doubleCheckOut,
          status,
          isLeave,
          lateBy,
        });
      });
    }

    // ✅ Absent fill karte waqt bhi leave aur holiday skip karo

    // const employees = {};
    // records.forEach((r) => {
    //   if (r.empNo && r.empNo !== 0) {
    //     if (!employees[r.empNo]) {
    //       employees[r.empNo] = {
    //         empNo: r.empNo,
    //         department: r.department || "N/A",
    //         name: r.name || "N/A",
    //       };
    //     }
    //   }
    // });

    // const allDates = records.map((r) => new Date(r.date));
    // const minDate = new Date(Math.min(...allDates));
    // const maxDate = new Date(Math.max(...allDates));

    // for (const emp in employees) {
    //   let checkDate = new Date(minDate);

    //   while (checkDate <= maxDate) {
    //     const dateOnly = checkDate.toISOString().split("T")[0];
    //     const isSunday = checkDate.getDay() === 0;
    //     const isHoliday = holidayDates.includes(dateOnly);
    //     const isLeave = leaveMap[`${emp}_${dateOnly}`] || false;

    //     if (!isSunday && !isHoliday && !isLeave) {
    //       const exists = processedRecords.some(
    //         (r) =>
    //           r.empNo === Number(emp) &&
    //           new Date(r.date).toISOString().split("T")[0] === dateOnly
    //       );

    //       if (!exists) {
    //         processedRecords.push({
    //           empNo: employees[emp].empNo,
    //           department: employees[emp].department,
    //           name: employees[emp].name,
    //           date: dateOnly,
    //           checkInCount: 0,
    //           checkOutCount: 0,
    //           status: "Absent",
    //           isLeave: false,
    //           lateBy: null,
    //         });
    //       }
    //     }

    //     checkDate.setDate(checkDate.getDate() + 1);
    //   }
    // }

    return res.status(200).json({
      success: true,
      message: "✅ Attendance fetched with holiday logic",
      count: processedRecords.length,
      records: processedRecords,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching attendance",
      error: error.message,
    });
  }
};

const getSingleAttendance = async (req, res) => {
  try {
    const { empNo } = req.params;
    const { month, year } = req.query;

    if (!empNo || !month || !year) {
      return res.status(400).json({
        success: false,
        message:
          "❌ empNo month and year are required (format: month=09&year=2025)",
      });
    }

    // ✅ Get Office Timing (from ManageOfficeTime collection)
    const officeTime = await ManageOfficeTime.findOne({})
      .sort({ created_at: -1 })
      .lean();

    if (!officeTime) {
      return res.status(400).json({
        success: false,
        message:
          "❌ Office timing not found in ManageOfficeTime collection. Please set office checkInTime and checkOutTime first.",
      });
    }

    // Extract office check-in and check-out times directly
    const officeCheckIn = officeTime.checkInTime;
    const officeCheckOut = officeTime.checkOutTime;

    // ✅ Convert office check-in/out time (like "9:00 AM") to Date object
    const parseOfficeTime = (baseDate, timeStr) => {
      const [time, modifier] = timeStr.split(" "); // ["9:00 AM"]
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      const result = new Date(baseDate);
      result.setHours(hours, minutes || 0, 0, 0);
      return result;
    };

    // ✅ Month aur year ko Date filter mai use karne ke liye start aur end date banao
    // const startDate = new Date(`${year}-${month}-01T00:00:00Z`);
    // const endDate = new Date(`${year}-${month}-31T23:59:59Z`);

    const startDate = new Date(`${year}-${month}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Agla month
    endDate.setDate(endDate.getDate() - 1); // Pichla din
    endDate.setHours(23, 59, 59, 999); // Day ka end time

    // Example: September 2025
    // startDate: "2025-09-01T00:00:00Z"
    // endDate: "2025-09-30T23:59:59Z"

    // console.log("startDate:", startDate);
    // console.log("endDate:", endDate);

    const employee = await Employee.findOne({ empNo: Number(empNo) }).lean();
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const allRecords = await Attendance.find({ empNo: Number(empNo) }).lean();

    const records = allRecords.filter((rec) => {
      const d = new Date(rec.date);
      return d >= startDate && d <= endDate;
    });
    // console.log("records: ", records);

    const holidays = await Holiday.find({
      $expr: {
        $and: [
          { $gte: [{ $dateFromString: { dateString: "$date" } }, startDate] },
          { $lte: [{ $dateFromString: { dateString: "$date" } }, endDate] },
        ],
      },
    }).lean();

    const leaves = await Leave.find({
      empNo: Number(empNo),
      $expr: {
        $and: [
          { $gte: [{ $dateFromString: { dateString: "$date" } }, startDate] },
          { $lte: [{ $dateFromString: { dateString: "$date" } }, endDate] },
        ],
      },
    }).lean();

    const remote = await Remote.find({
      empNo: Number(empNo),
      $expr: {
        $and: [
          { $gte: [{ $dateFromString: { dateString: "$date" } }, startDate] },
          { $lte: [{ $dateFromString: { dateString: "$date" } }, endDate] },
        ],
      },
    }).lean();

    // if (!records || records.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: `❌ Attendance not found for empNo ${empNo}`,
    //     records: [],
    //   });
    // }

    const holidayDates = holidays.map(
      (h) => new Date(h.date).toISOString().split("T")[0]
    );

    // LEAVE RESPONSE
    //     {
    //   "2025-08-05": true,
    //   "2025-08-12": true
    //    }
    const leaveMap = {};
    leaves.forEach((l) => {
      const dateOnly = new Date(l.date).toISOString().split("T")[0];
      leaveMap[dateOnly] = true;
    });

    const remoteMap = {};
    remote.forEach((l) => {
      const dateOnly = new Date(l.date).toISOString().split("T")[0];
      remoteMap[dateOnly] = true;
    });
    // console.log("remoteMap: ", remoteMap);

    // 🔹 Group by date

    //     {
    //   "2025-08-01": [
    //     { empNo: 10, date: "2025-08-01T12:11:49Z", status: "In" },
    //     { empNo: 10, date: "2025-08-01T22:29:54Z", status: "Out" }
    //   ],
    //   "2025-08-02": [
    //     { empNo: 10, date: "2025-08-02T12:39:02Z", status: "In" }
    //   ]
    // }

    const grouped = {};
    for (const rec of records) {
      const dateOnly = new Date(rec.date).toISOString().split("T")[0];
      if (!grouped[dateOnly]) grouped[dateOnly] = [];
      grouped[dateOnly].push(rec);
    }

    const processedRecords = [];

    // ✅ Format functions
    const formatHours = (hoursFloat) => {
      const totalSeconds = Math.round(hoursFloat * 3600); // total seconds nikal lo
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours === 0 && minutes === 0 && seconds === 0) return "0 seconds";
      if (hours === 0 && minutes === 0) return `${seconds} seconds`;
      if (hours === 0 && seconds === 0) return `${minutes} minutes`;
      if (hours === 0) return `${minutes} minutes ${seconds} seconds`;
      if (minutes === 0 && seconds === 0) return `${hours} hours`;
      if (minutes === 0) return `${hours} hours ${seconds} seconds`;
      if (seconds === 0) return `${hours} hours ${minutes} minutes`;
      return `${hours} hours ${minutes} minutes ${seconds} seconds`;
    };

    for (const date in grouped) {
      const dayRecords = grouped[date];
      let checkIns = dayRecords.filter((r) => r.status === "In");
      let checkOuts = dayRecords.filter((r) => r.status === "Out");

      let status = "On Time";
      let lateBy = null;
      let totalHours = 0;
      let extraHours = 0;
      let earlyBy = null;

      // ✅ yahan pehle hi null set kar do
      let firstCheckInTime = null;
      let lastCheckOutTime = null;

      const currentDate = new Date(dayRecords[0].date);
      const isSunday = currentDate.getDay() === 0;
      const isHoliday = holidayDates.includes(date);
      const isLeave = leaveMap[date] || false;
      const isRemote = remoteMap[date] || false;

      if (isSunday) {
        status = "Off";
      } else if (isHoliday) {
        status = "Holiday";
        checkIns = 0;
        checkOuts = 0;
      } else if (isLeave) {
        status = "Leave";
        checkIns = 0;
        checkOuts = 0;
      } else if (isRemote) {
        status = "Remote";
        checkIns = 0;
        checkOuts = 0;
      } else if (checkIns.length === 0) {
        status = "Late";
      } else if (checkIns.length === 0 && checkOuts.length === 0) {
        status = "Absent";
      } else if (checkIns.length > 0) {
        const sortedIn = checkIns.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        const sortedOut = checkOuts.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        const firstIn = sortedIn.length > 0 ? new Date(sortedIn[0].date) : null;

        const lastOut =
          sortedOut.length > 0 ? new Date(sortedOut[0].date) : null;

        if (firstIn && lastOut) {
          const totalMinutes = differenceInMinutes(lastOut, firstIn);
          totalHours = parseFloat((totalMinutes / 60).toFixed(2));

          const ninePM = set(new Date(firstIn), {
            hours: 21,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          });

          if (lastOut > ninePM) {
            const extraMinutes = differenceInMinutes(lastOut, ninePM);
            extraHours = parseFloat((extraMinutes / 60).toFixed(2));
          }
        }

        firstCheckInTime = firstIn
          ? new Date(firstIn).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : null;

        lastCheckOutTime = lastOut
          ? new Date(lastOut).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : null;

        // const target = set(new Date(firstIn), {
        //   hours: 12,
        //   minutes: 15,
        //   seconds: 0,
        //   milliseconds: 0,
        // });

        const target = parseOfficeTime(firstIn, officeCheckIn);
        const officeOutTarget = parseOfficeTime(firstIn, officeCheckOut);

        // console.log("target: ", target.toLocaleDateString());

        // if (firstIn > target) {
        //   status = "Late";
        //   const minutesLate = differenceInMinutes(firstIn, target);
        //   const hours = Math.floor(minutesLate / 60);
        //   const mins = minutesLate % 60;
        //   lateBy = `${hours > 0 ? hours + "h " : ""}${mins}m`;
        // }

        if (firstIn > target) {
          status = "Late";
          const minutesLate = differenceInMinutes(firstIn, target);
          const hours = Math.floor(minutesLate / 60);
          const mins = minutesLate % 60;
          lateBy = `${hours > 0 ? hours + "h " : ""}${mins}m`;
        }

        if (lastOut && lastOut > officeOutTarget) {
          const extraMinutes = differenceInMinutes(lastOut, officeOutTarget);
          extraHours = (extraMinutes / 60).toFixed(2);
        }

        // console.log("target123: ", target.toLocaleTimeString());
      }

      const formattedTotalHours = formatHours(parseFloat(totalHours || 0));
      const formattedExtraHours = formatHours(parseFloat(extraHours || 0));

      processedRecords.push({
        empNo: Number(empNo),
        date,
        checkInCount: checkIns.length,
        checkOutCount: checkOuts.length,
        firstCheckInTime,
        lastCheckOutTime,
        status,
        lateBy,
        totalHours: formattedTotalHours,
        extraHours: formattedExtraHours,
      });
    }

    // 🔹 Fill Absent + Sunday
    // const allDates = records.map((r) => new Date(r.date));
    // const minDate = new Date(Math.min(...allDates));
    // const maxDate = new Date(Math.max(...allDates));
    // maxDate.setMonth(maxDate.getMonth() + 1, 0);

    // let checkDate = new Date(minDate);

    // 🔹 Fill Absent + Sunday - CORRECTED VERSION
    const allDates = records.map((r) => new Date(r.date));

    // Agar koi record nahi hai, toh startDate se endDate tak sab absent honge
    let checkDate = new Date(startDate); // ✅ September 01 se start karo
    const maxDate = new Date(endDate);

    while (checkDate <= maxDate) {
      const dateOnly = checkDate.toISOString().split("T")[0];
      const isSunday = checkDate.getDay() === 0;
      const isHoliday = holidayDates.includes(dateOnly);
      const isLeave = leaveMap[dateOnly] || false;
      const isRemote = remoteMap[dateOnly] || false;

      const exists = processedRecords.some((r) => r.date === dateOnly);

      if (!exists) {
        if (isSunday) {
          processedRecords.push({
            empNo: Number(empNo),
            date: dateOnly,
            checkInCount: 0,
            checkOutCount: 0,
            status: "Off",
            lateBy: null,
            totalHours: 0,
          });
        } else if (isHoliday) {
          processedRecords.push({
            empNo: Number(empNo),
            date: dateOnly,
            checkInCount: 0,
            checkOutCount: 0,
            status: "Holiday",
            lateBy: null,
            totalHours: 0,
          });
        } else if (isLeave) {
          processedRecords.push({
            empNo: Number(empNo),
            date: dateOnly,
            checkInCount: 0,
            checkOutCount: 0,
            status: "Leave",
            lateBy: null,
            totalHours: 0,
          });
        } else if (isRemote) {
          processedRecords.push({
            empNo: Number(empNo),
            date: dateOnly,
            checkInCount: 0,
            checkOutCount: 0,
            status: "Remote",
            lateBy: null,
            totalHours: 0,
          });
        } else {
          processedRecords.push({
            empNo: Number(empNo),
            date: dateOnly,
            checkInCount: 0,
            checkOutCount: 0,
            status: "Absent",
            lateBy: null,
            totalHours: 0,
          });
        }
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    // 🔹 Summary
    const totalDays = processedRecords.length;
    // console.log("totalDays: ", totalDays);

    const present = processedRecords.filter(
      (r) => r.status === "On Time" || r.status === "Late"
    ).length;

    const onTime = processedRecords.filter(
      (r) => r.status === "On Time"
    ).length;

    const absent = processedRecords.filter((r) => r.status === "Absent").length;

    const late = processedRecords.filter((r) => r.status === "Late").length;

    const holidaysCount = processedRecords.filter(
      (r) => r.status === "Holiday"
    ).length;

    const sundays = processedRecords.filter((r) => r.status === "Off").length;

    const leavesCount = processedRecords.filter(
      (r) => r.status === "Leave"
    ).length;

    const remoteCount = processedRecords.filter(
      (r) => r.status === "Remote"
    ).length;

    // Salary calculation
    // const baseSalary = employee.salary || 0;
    // console.log("baseSalary: ", baseSalary);

    // const absentDeduction = absent * 300;
    // // const lateDeduction = late * 200;
    // const lateDeduction = late * 250;
    // const netSalary = baseSalary - absentDeduction - lateDeduction;

    // Salary calculation
    const baseSalary = employee.salary || 0;
    // console.log("baseSalary: ", baseSalary);

    // Month ke total din nikal lo
    const daysInMonth = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth() + 1,
      0
    ).getDate();

    // console.log("daysInMonth: ", daysInMonth);

    // Per day salary
    const perDaySalary = baseSalary / daysInMonth;
    console.log("perDaySalary: ", perDaySalary);

    const convertToNormalNumber = Math.round(perDaySalary);
    console.log("convertToNormalNumber: ", convertToNormalNumber);

    // Absent deduction = absent * perDaySalary
    const absentDeduction = absent * convertToNormalNumber;
    console.log("absentDeduction: ", absentDeduction);

    // Late deduction (rule: 1 late = 250)
    const lateDeduction = late * 250;
    console.log("lateDeduction: ", lateDeduction);

    // Final salary
    const netSalary = baseSalary - absentDeduction - lateDeduction;
    // console.log("netSalary: ", netSalary);

    // 🔹 Check if employee has active loan
    // const existingLoan = await officeLoan
    //   .find({
    //     employeeId: employee._id,
    //     deleted_at: null, // agar soft delete use kar rahe ho to
    //   })
    //   .lean();
    // console.log("existingLoan: ", existingLoan);

    // let finalSalary = netSalary;
    // let totalLoanDeduction = 0;

    // existingLoan.forEach((Amount) => {
    //   let loanDate = Amount.date;
    //   totalLoanDeduction += Amount.loan;
    // });
    // finalSalary = netSalary - totalLoanDeduction;

    // ✅ Get all loans for employee
    const existingLoan = await officeLoan
      .find({
        employeeId: employee._id,
        deleted_at: null,
      })
      .lean();

    let totalLoanDeduction = 0;

    existingLoan.forEach((loanItem) => {
      const loanDate = new Date(loanItem.date);
      const loanMonth = loanDate.getMonth() + 1; // JS months start at 0
      const loanYear = loanDate.getFullYear();

      // ✅ Compare with requested salary month/year
      if (loanMonth === Number(month) && loanYear === Number(year)) {
        totalLoanDeduction += loanItem.loan;
      }
    });

    // ✅ Final salary calculation
    const finalSalary = netSalary - totalLoanDeduction;

    return res.status(200).json({
      success: true,
      message: `✅ Attendance fetched for empNo ${empNo}`,
      records: processedRecords.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
      summary: {
        totalMonth: daysInMonth,
        // ✅ Working days = total days - holidays - sundays
        workingDays: daysInMonth - holidaysCount - sundays,

        // ✅ Present = sirf On Time ya Late wale din (Absent, Leave, Holiday exclude)
        present: processedRecords.filter(
          (r) => r.status === "On Time" || r.status === "Late"
        ).length,

        onTime,
        absent,
        late,
        holidays: holidaysCount,
        sundays,
        leaves: leavesCount,
        remotes: remoteCount,
        baseSalary,
        absentDeduction,
        lateDeduction,
        totalLoanDeduction,
        netSalary,
        finalSalary,
      },
    });
  } catch (error) {
    console.error("❌ getSingleAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching single employee attendance",
      error: error.message,
    });
  }
};

const getAllAttendance1 = async (req, res) => {
  try {
    const records = await Attendance.find({}).lean();
    // sort({ created_at: -1 })

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "✅ Attendance not found",
        records: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Attendance fetched with logic",
      count: records.length,
      records: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching attendance",
      error: error.message,
    });
  }
};

export {
  uploadAttendanceExcel,
  getAllAttendance,
  getSingleAttendance,
  // getSingleAttendance1,
  getAllAttendance1,
};
