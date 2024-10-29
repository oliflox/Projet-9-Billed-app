import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am on NewBill Page", () => {
  let newBillInstance;

  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }));
    document.body.innerHTML = NewBillUI();
    newBillInstance = new NewBill({
      document,
      onNavigate: jest.fn(),
      store: mockStore,
      localStorage: localStorageMock,
    });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  describe("When I use handleChangeFile", () => {
    test("Then it should alert if file type is not allowed", () => {
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(['file content'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(window.alert).toHaveBeenCalledWith('Seuls les fichiers jpg, jpeg, png et gif sont acceptés.');
      expect(fileInput.value).toBe("");
    });

    test("Then it should update file details if valid file is uploaded", async () => {
      const fileInput = screen.getByTestId("file");

      const validFile = new File(['file content'], 'test.jpg', { type: 'image/jpeg' });

      const bills = mockStore.bills();
      jest.spyOn(mockStore, "bills").mockReturnValue(bills);

      const createSpy = jest.spyOn(bills, "create").mockResolvedValue({
        fileUrl: "https://mockurl.com/file.jpg",
        key: "1234"
      });

      fireEvent.change(fileInput, { target: { files: [validFile] });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(createSpy).toHaveBeenCalled();

      await createSpy.mock.results[0].value;

      expect(newBillInstance.fileName).toBe('test.jpg');
      expect(newBillInstance.billId).toBe("1234");
    });
  });

  describe("When I use handleSubmit", () => {
    test("Then it should call updateBill and navigate to Bills page if the form is valid", () => {
      const updateBillSpy = jest.spyOn(newBillInstance, "updateBill");
      const onNavigateSpy = newBillInstance.onNavigate;

      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Vol Paris Londres" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-05-25" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "300" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "60" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Déplacement professionnel" } });

      const fileInput = screen.getByTestId("file");
      const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [validFile] });

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      expect(updateBillSpy).toHaveBeenCalled();
      expect(onNavigateSpy).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });

    test("Then it should not call updateBill if form is invalid", () => {
      const updateBillSpy = jest.spyOn(newBillInstance, "updateBill");
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "" } });

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      expect(updateBillSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
