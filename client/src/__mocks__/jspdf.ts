// Module-level spies that persist across instances
export const mockSave = jest.fn();
export const mockText = jest.fn();
export const mockAddImage = jest.fn();
export const mockAddPage = jest.fn();
export const mockSetFontSize = jest.fn();
export const mockSetTextColor = jest.fn();
export const mockSetFont = jest.fn();
export const mockRect = jest.fn();
export const mockLine = jest.fn();
export const mockCircle = jest.fn();
export const mockSetDrawColor = jest.fn();
export const mockSetFillColor = jest.fn();

class MockJsPDF {
  text = mockText;
  addPage = mockAddPage;
  save = mockSave;
  setFontSize = mockSetFontSize;
  setTextColor = mockSetTextColor;
  setFont = mockSetFont;
  rect = mockRect;
  line = mockLine;
  circle = mockCircle;
  setDrawColor = mockSetDrawColor;
  setFillColor = mockSetFillColor;
  addImage = mockAddImage;
  internal = {
    pageSize: { width: 210, height: 297 },
  };

  constructor() {
    return this;
  }
}

export default MockJsPDF;
export const jsPDF = MockJsPDF;