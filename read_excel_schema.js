const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'table-data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx'));

files.forEach(file => {
    console.log(`\n--- Reading ${file} ---`);
    const workbook = xlsx.readFile(path.join(dataDir, file));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length > 0) {
        console.log(`Columns: ${JSON.stringify(data[0])}`);
        console.log(`First row data: ${JSON.stringify(data[1])}`);
    } else {
        console.log("Empty sheet");
    }
});
