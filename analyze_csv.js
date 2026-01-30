const fs = require('fs');
const path = require('path');

const filePath = "d:\\Downloads\\websites\\crm-elegance\\Relatório estatisticaMedica 2026-01-06 16-48-45.csv";

try {
    const content = fs.readFileSync(filePath, 'latin1'); // Using latin1 to handle potential accents safely without utf8 BOM issues
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) {
        console.log("Empty file");
        process.exit(0);
    }

    const header = lines[0].split(';');
    const columns = header.map(h => h.trim());

    const stats = columns.map(col => ({
        name: col,
        populatedCount: 0,
        uniqueValues: new Set(),
        sampleValues: []
    }));

    const totalRows = lines.length - 1;

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(';');

        row.forEach((value, index) => {
            if (index >= stats.length) return;

            const cleanValue = value ? value.trim() : '';
            if (cleanValue !== '') {
                stats[index].populatedCount++;
                // Limit unique values storage to avoid memory issues on huge files
                if (stats[index].uniqueValues.size < 100) {
                    stats[index].uniqueValues.add(cleanValue);
                }
                if (stats[index].sampleValues.length < 5) {
                    stats[index].sampleValues.push(cleanValue);
                }
            }
        });
    }

    console.log("Total Rows:", totalRows);
    console.log(JSON.stringify(stats.map(s => ({
        column: s.name,
        populatedPercentage: ((s.populatedCount / totalRows) * 100).toFixed(1) + '%',
        uniqueCount: s.uniqueValues.size >= 100 ? '100+' : s.uniqueValues.size,
        isAlwaysEmpty: s.populatedCount === 0,
        hasSingleValue: s.uniqueValues.size === 1,
        singleValue: s.uniqueValues.size === 1 ? Array.from(s.uniqueValues)[0] : null,
        samples: s.sampleValues
    })), null, 2));

} catch (err) {
    console.error("Error:", err.message);
}
