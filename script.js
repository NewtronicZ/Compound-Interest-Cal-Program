// ตัวแปรสำหรับเก็บ instance ของ Chart เพื่อใช้ในการอัปเดตหรือลบกราฟเก่า
let compoundChart; 
// ตัวแปรสำหรับฟอร์แมตตัวเลขสกุลเงิน (ใช้สำหรับการแสดงผลเท่านั้น)
const formatter = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


/**
 * ฟังก์ชันหลักในการคำนวณดอกเบี้ยทบต้นและแสดงผลรวมถึงกราฟ
 */
function calculateCompoundInterest() {
    // 1. รับค่าจาก Input
    const principal = parseFloat(document.getElementById('principal').value) || 0;
    const monthlyDeposit = parseFloat(document.getElementById('monthlyDeposit').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) / 100; // อัตราดอกเบี้ยทศนิยม
    const time = parseInt(document.getElementById('time').value); // ระยะเวลาเป็นปี

    // กำหนดให้ n = 12 คงที่ (ทบต้นเดือนละ 1 ครั้ง)
    const compounding = 12;
    const n = compounding;
    const r_per_n = rate / n; // อัตราดอกเบี้ยต่องวด
    const total_n = n * time; // จำนวนงวดทั้งหมด

    // 2. ตรวจสอบความถูกต้อง
    if (isNaN(rate) || isNaN(time) || (principal < 0 && monthlyDeposit < 0) || time < 1) {
        document.getElementById('totalDeposit').textContent = formatter.format(0) + " บาท";
        document.getElementById('totalInterest').textContent = formatter.format(0) + " บาท";
        document.getElementById('totalWealth').textContent = "กรุณาใส่จำนวนเงินหรือระยะเวลาที่ถูกต้อง";
        
        // ลบกราฟเก่าออกหากมี
        if (compoundChart) compoundChart.destroy();
        return;
    }

    let totalDeposited = principal;
    let annualData = []; // เก็บยอดเงินรวม ณ สิ้นปีแต่ละปี
    let annualLabels = []; // เก็บหมายเลขปี (0, 1, 2, ...)

    // บันทึกยอดเริ่มต้น (ปีที่ 0)
    annualLabels.push(0);
    annualData.push(principal);

    // 3. คำนวณยอดรวมรายปี
    for (let year = 1; year <= time; year++) {
        // จำนวนงวดที่คำนวณถึงสิ้นปีนี้
        const total_compounding_periods = n * year;

        // สูตรดอกเบี้ยทบต้น (FV ของเงินต้นเริ่มต้น)
        const fv_principal = principal * Math.pow((1 + r_per_n), total_compounding_periods);

        // สูตรมูลค่าอนาคตของ Annuity Due (FV ของเงินฝากรายงวด)
        let fv_annuity = 0;
        if (monthlyDeposit > 0) {
            // จำนวนงวดที่ฝากไปแล้ว
            const num_deposits = n * year; 
            
            // สูตร FVA (Ordinary Annuity)
            const fv_annuity_ordinary = monthlyDeposit * (
                (Math.pow((1 + r_per_n), num_deposits) - 1) / r_per_n
            );
            
            // แปลงเป็น Annuity Due (ฝากต้นงวด: คูณด้วย (1 + r/n))
            fv_annuity = fv_annuity_ordinary * (1 + r_per_n);
        }

        // ยอดเงินรวม ณ สิ้นปี
        const finalAmountAtYear = fv_principal + fv_annuity;
        
        annualLabels.push(year);
        annualData.push(finalAmountAtYear);
    }
    
    // คำนวณเงินฝากรวมทั้งหมด (เฉพาะปีสุดท้าย)
    totalDeposited += (monthlyDeposit * 12 * time);

    // 4. คำนวณผลลัพธ์สุดท้าย
    const finalFutureValue = annualData[annualData.length - 1];
    const totalInterest = finalFutureValue - totalDeposited;


    // 5. แสดงผลลัพธ์
    document.getElementById('totalDeposit').textContent = formatter.format(totalDeposited) + " บาท";
    document.getElementById('totalInterest').textContent = formatter.format(totalInterest) + " บาท";
    document.getElementById('totalWealth').textContent = formatter.format(finalFutureValue) + " บาท";

    // 6. แสดงกราฟ
    renderChart(annualLabels, annualData, principal);
}


/**
 * ฟังก์ชันวาดกราฟด้วย Chart.js
 */
function renderChart(labels, totalAmounts, principal) {
    const ctx = document.getElementById('compoundInterestChart').getContext('2d');
    
    // หากมีกราฟเดิมอยู่ ให้ทำลายทิ้งก่อน
    if (compoundChart) {
        compoundChart.destroy();
    }
    
    // สร้างชุดข้อมูลของเงินฝากรวม (Total Deposit) สำหรับเปรียบเทียบ
    const monthlyDeposit = parseFloat(document.getElementById('monthlyDeposit').value) || 0;
    
    const depositData = labels.map(year => {
        // total_deposit = เงินต้น + (ฝากรายเดือน * 12 * ปี)
        return principal + (monthlyDeposit * 12 * year);
    });
    
    // สร้างกราฟใหม่
    compoundChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'เงินรวมทั้งหมด (Wealth) - ดอกเบี้ยทบต้น',
                    data: totalAmounts,
                    borderColor: 'rgb(0, 123, 255)', 
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4
                },
                {
                    label: 'เงินฝากรวมทั้งหมด (Total Deposit) - เส้นตรง',
                    data: depositData,
                    borderColor: 'rgb(40, 167, 69)', 
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0, // เส้นตรง
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: 'ระยะเวลา (ปี)' },
                    ticks: { stepSize: 1 } 
                },
                y: {
                    title: { display: true, text: 'จำนวนเงิน (บาท)' },
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'การเติบโตของดอกเบี้ยทบต้นเทียบกับเงินฝากรวม'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatter.format(context.parsed.y) + ' บาท';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}


// ผูกฟังก์ชันกับปุ่มและเรียกใช้ครั้งแรกเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function () {
    const calculateButton = document.getElementById('calculate-btn');
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateCompoundInterest);
    }
    
    // เรียกคำนวณครั้งแรกเมื่อโหลดหน้า
    calculateCompoundInterest();
});