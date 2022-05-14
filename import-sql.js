const fs = require("fs");

function sqlToJson(sql) {
	let json = {};

	sql = sql.replaceAll("`", "");

	const insertStatements = sql.match(/INSERT INTO.+?VAlUES.+?;/gsi);

	for (const insert of insertStatements) {
		const tableName = insert.match(/INSERT INTO (\w+?) /i)[1];
		const columns = insert.match(/\((.+?)\).+VALUES/)[1].split(',').map(column => column.trim());
		const values = parseValues(insert);
		for (const value of values) {
			const row = {};
			for (let i = 0; i < columns.length; i++) {
				row[columns[i]] = value[i];
			}
			json[tableName] = json[tableName] || [];
			json[tableName].push(row);
		}
	}
	return json;
}

function parseValues(insert) {
	const valuesStatement = insert.match(/VALUES(.+?);/si)[1];
	const rows = valuesStatement.match(/\((.+?)\)[,;]\n/gi).map(row => row.slice(1, -3).trim());
	const parsedRows = [];
	for (const row of rows) {
		// Values could contain commas, so we can't just split on commas
		let values = [];
		let currentValue = '';
		let inQuotes = false;
		for (const char of row) {
			if (char === '\'') {
				inQuotes = !inQuotes;
				currentValue += char;
			} else if (char === ',' && !inQuotes) {
				values.push(currentValue);
				currentValue = '';
			} else if (char === ' ' && !inQuotes) {
				continue;
			} else {
				currentValue += char;
			}
		}
		values.push(currentValue);
		parsedRows.push(values);
	}
	// Values could be of different types like strings, numbers, booleans, nulls, etc.
	// We need to convert them to the correct type
	const finalRows = [];
	for (let i = 0; i < parsedRows.length; i++) {
		const row = parsedRows[i];
		finalRows[i] = [];
		for (let j = 0; j < row.length; j++) {
			const value = row[j];
			if (value === 'NULL') {
				finalRows[i][j] = null;
			} else if (value === 'TRUE') {
				finalRows[i][j] = true;
			} else if (value === 'FALSE') {
				finalRows[i][j] = false;
			} else if (value.match(/^\d+$/)) {
				finalRows[i][j] = parseInt(value);
			} else if (value.match(/^\d+\.\d+$/)) {
				finalRows[i][j] = parseFloat(value);
			} else if (value.match(/^'.*'$/)) {
				finalRows[i][j] = value.slice(1, -1);
			} else {
				throw new Error(`Unknown value type: ->${value}<-`);
			}
		}
	}
	return finalRows;
}

// Get arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
	console.error("Usage: node import-sql.js <sql-file>");
	process.exit(1);
}
const sqlFile = args[0];
const sql = fs.readFileSync(sqlFile, 'utf8');
const json = sqlToJson(sql);
fs.writeFileSync(sqlFile.replace('.sql', '.json'), JSON.stringify(json, null, 2));
console.log(`${sqlFile} -> ${sqlFile.replace('.sql', '.json')}`);
process.exit(0);