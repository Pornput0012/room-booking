
const { chromium } = require("playwright");
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

// Set EJS as the view engine
app.set("view engine", "ejs");

async function testPlayWright() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://webapp3.sit.kmutt.ac.th/booking/web/announce.htm");

  // คลิกที่ปุ่ม Submit
  await page.click("input[name='Submit']");

  // รอให้ตารางโหลด
  await page.waitForSelector("#day_main > tbody > tr");

  // ดึงข้อมูลจากแต่ละแถวในตาราง
  const result = await page.$$eval("#day_main > tbody > tr", (rows) => {
    // จำกัดการวนลูปเพียง 8 รอบ

    return rows
      .map((row) => {
        // ค้นหาเซลล์ที่มี class "A"
        const classACells = Array.from(row.querySelectorAll("td.A"));

        // แปลงข้อมูลใน cell
        return classACells.map((cell) => {
          // ค้นหา div ที่มี class "celldiv"
          const row_labels = row.querySelector(".row_labels > div > a");

          // ค้นหา link ภายใน cell
          const linkElement = cell.querySelector("a");

          return {
            start: row_labels?.textContent.trim(),
            subject: linkElement ? linkElement?.textContent.trim() : null,
          };
        });
      })
      .flat(); // ใช้ flat() เพื่อรวม array ที่ซ้อนกัน
  });

  await browser.close();
  return result;
}

// Route หลัก
app.get("/", async (req, res) => {
  try {
    const schedule = await testPlayWright();
    res.render("schedule", { schedule });
  } catch (error) {
    res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
});

// Route API สำหรับ JSON
app.get("/api/schedule", async (req, res) => {
  try {
    const result = await testPlayWright();
    return res.json(result);
  } catch (error) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
