export const utils = {
  json_to_sheet: jest.fn(() => ({})),
  book_new: jest.fn(() => ({})),
  book_append_sheet: jest.fn(),
  sheet_to_csv: jest.fn(() => 'mocked,csv,data'),
  aoa_to_sheet: jest.fn(() => ({})),
};

export const writeFile = jest.fn();
export const write = jest.fn();
export const readFile = jest.fn();

const XLSX = {
  utils,
  writeFile,
  write,
  readFile,
};

export default XLSX;