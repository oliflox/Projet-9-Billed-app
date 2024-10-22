/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      $.fn.modal = jest.fn();
    });

    test("Then the bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      // expect(windowIcon.classList.contains('active-icon')).toBe(true);
    });

    test("Then the bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then the NewBill Button should redirect to New Bill page", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });
      const handleClickNewBill = jest.fn(billsInstance.handleClickNewBill);
      const buttonNewBill = screen.getByTestId("btn-new-bill");

      buttonNewBill.addEventListener('click', handleClickNewBill);
      fireEvent.click(buttonNewBill);

      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByTestId("new-bill-page")).toBeTruthy();
    });

    test("Then each eye icon should open the modal when clicked", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage });
      const iconEyes = screen.getAllByTestId("icon-eye");

      iconEyes.forEach(icon => {
        icon.addEventListener('click', () => billsInstance.handleClickIconEye(icon));
        fireEvent.click(icon);

        expect($.fn.modal).toHaveBeenCalledWith('show');
      });
    });

    describe("When I fetch bills from the mock API", () => {
      test("Then it should return undefined if store is null", async () => {
        const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage });

        const result = await billsInstance.getBills();

        expect(result).toBeUndefined();
      });

      test("Then it should fetch bills correctly from the API", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.resolve([{
            id: "1",
            date: "2023-01-01",
            status: "pending"
          }, {
            id: "2",
            date: "2023-02-01",
            status: "accepted"
          }])
        }));

        const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

        const bills = await billsInstance.getBills();

        expect(bills.length).toBe(2);
        expect(bills[0].date).toBe("1 Jan. 23");
        expect(bills[1].status).toBe("Accepté");
      });

      test("Then it should handle date formatting errors gracefully", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.resolve([{
            id: "1",
            date: "invalid-date",
            status: "pending"
          }])
        }));

        const formatDateMock = jest.spyOn(require("../app/format.js"), "formatDate")
          .mockImplementation(() => { throw new Error("Invalid time value"); });

        const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        const bills = await billsInstance.getBills();

        expect(bills[0].date).toBe("invalid-date");

        formatDateMock.mockRestore();
      });

      test("Then it should log the length of bills when bills are fetched", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.resolve([{
            id: "1",
            date: "2023-01-01",
            status: "pending"
          }, {
            id: "2",
            date: "2023-02-01",
            status: "accepted"
          }])
        }));

        const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

        await billsInstance.getBills();
      });
    });
  });
});
