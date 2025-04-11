import { ROUTES_PATH } from '../constants/routes.js';
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.localStorage = localStorage;
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
  }
  
  handleChangeFile = e => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
    if (!file) {
      return;
    }
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Seuls les fichiers jpg, jpeg, png et gif sont acceptés.');
      e.target.value = '';
      return;
    }
    
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append('file', file);
    formData.append('email', email);
  
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({ fileUrl, key }) => {
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch(error => console.error("Create API call failed", error));
  };
  
  handleSubmit = e => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const type = e.target.querySelector(`select[data-testid="expense-type"]`).value;
    const name = e.target.querySelector(`input[data-testid="expense-name"]`).value;
    const amount = parseInt(e.target.querySelector(`input[data-testid="amount"]`).value);
    const date = e.target.querySelector(`input[data-testid="datepicker"]`).value;
    const vat = e.target.querySelector(`input[data-testid="vat"]`).value;
    const pct = parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20;
    const commentary = e.target.querySelector(`textarea[data-testid="commentary"]`).value;
  
    if (!type || !name || !amount || !date) {
      return;
    }
  
    const bill = {
      email,
      type,
      name,
      amount,
      date,
      vat,
      pct,
      commentary,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    };
  
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH['Bills']);
  };

  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills']);
        })
        .catch(error => console.error(error));
    }
  };
}
