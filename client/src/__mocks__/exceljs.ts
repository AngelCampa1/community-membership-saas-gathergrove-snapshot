/**
 * Mock for exceljs library used in testing
 */

// Mock Worksheet class
class MockWorksheet {
  name = '';
  columns: any[] = [];
  rows: any[] = [];

  addRow(data: any) {
    this.rows.push(data);
    return { font: {}, fill: {} };
  }

  addRows(data: any[]) {
    data.forEach(row => this.addRow(row));
  }

  getRow(index: number) {
    return {
      font: {},
      fill: {},
      values: this.rows[index - 1] || {}
    };
  }
}

// Mock Workbook class
class MockWorkbook {
  creator = '';
  created = new Date();
  modified = new Date();
  worksheets: MockWorksheet[] = [];

  addWorksheet(name: string) {
    const worksheet = new MockWorksheet();
    worksheet.name = name;
    this.worksheets.push(worksheet);
    return worksheet;
  }

  get xlsx() {
    return {
      writeBuffer: async () => Buffer.from('mock-excel-data'),
      writeFile: async () => Promise.resolve()
    };
  }
}

// Mock ExcelJS module
const ExcelJS = {
  Workbook: MockWorkbook
};

export default ExcelJS;
