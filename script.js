function calculateCompoundInterest() {
    // 1. รับค่าจาก Input
    const principal = parseFloat(document.getElementById('principal').value) || 0;
    const monthlyDeposit = parseFloat(document.getElementById('monthlyDeposit').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) / 100;
    const time = parseInt(document.getElementById('time').value);

    // กำหนดให้ n = 12 คงที่ (ทบต้นเดือนละ 1 ครั้ง)
    const compounding = 12;

    // 2. ตรวจสอบความถูกต้อง
    if (isNaN(rate) || isNaN(time) || (principal <= 0 && monthlyDeposit <= 0) || time < 1) {
        document.getElementById('totalDeposit').textContent = "N/A";
        document.getElementById('totalInterest').textContent = "N/A";
        document.getElementById('totalWealth').textContent = "กรุณาใส่จำนวนเงินหรือระยะเวลาที่ถูกต้อง";
        return;
    }

    // 3. ตั้งค่าตัวแปรสูตร
    const n = compounding;
    const r_per_n = rate / n; // อัตราดอกเบี้ยต่องวด
    const total_n = n * time; // จำนวนงวดทั้งหมด
    let finalFutureValue = 0;

    // ส่วนที่ 1: เงินต้นเริ่มต้น (P) - Compound Interest ธรรมดา
    const fv_principal = principal * Math.pow((1 + r_per_n), total_n);
    finalFutureValue += fv_principal;

    // ส่วนที่ 2: เงินฝากรายงวด (PMT) - Future Value of Annuity
    let totalDeposit = principal;
    if (monthlyDeposit > 0) {
        const pmt_per_compounding = monthlyDeposit;

        // สูตร FVA (Ordinary Annuity - ฝากปลายงวด)
        const fv_annuity_ordinary = pmt_per_compounding * (
            (Math.pow((1 + r_per_n), total_n) - 1) / r_per_n
        );

        // *** การแก้ไขสูตร: แปลงเป็น Annuity Due (ฝากต้นงวด) ***
        // โดยคูณด้วย (1 + r/n)
        const fv_annuity = fv_annuity_ordinary * (1 + r_per_n);
        // *************************************************

        finalFutureValue += fv_annuity;

        totalDeposit += (monthlyDeposit * 12 * time);
    }

    // 4. คำนวณดอกเบี้ยทั้งหมด
    const totalInterest = finalFutureValue - totalDeposit;

    // 5. แสดงผลลัพธ์
    const formatter = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('totalDeposit').textContent = formatter.format(totalDeposit) + " บาท";
    document.getElementById('totalInterest').textContent = formatter.format(totalInterest) + " บาท";
    document.getElementById('totalWealth').textContent = formatter.format(finalFutureValue) + " บาท";
}

// ผูกฟังก์ชันกับปุ่มและเรียกใช้ครั้งแรก
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('calculate-btn').addEventListener('click', calculateCompoundInterest);
    calculateCompoundInterest();
});