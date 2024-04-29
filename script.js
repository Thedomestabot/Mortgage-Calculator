// Constants
const LOAN_LIMIT = 726200;
const FHA_MIP_RATE = 0.0175;
const INSURANCE_RATE = 0.00035; 
const VA_FUNDING_FEE_RATES = {
  firstTimeUse: {
    downPayment: {
      lt5: 0.0215,
      gte5AndLt10: 0.015,
      gte10: 0.0125,
    },
  },
  subsequentUse: {
    downPayment: {
      lt5: 0.033,
      gte5AndLt10: 0.015,
      gte10: 0.0125,
    },
  },
};

// Utility Functions
function calculateFundingFee(loanAmount, downPaymentPercentage, fundingFeeRate) {
  return (loanAmount * fundingFeeRate);
}

function calculateMIP(loanAmount) {
  return FHA_MIP_RATE * loanAmount;
}

function calculateMMIP(loanAmount, downPaymentPercentage, loanTerm) {
  const downPayment = downPaymentPercentage * 100;

  if (loanTerm > 15) {
    if (loanAmount <= LOAN_LIMIT) {
      return downPayment < 5
        ? (0.0055 * loanAmount) / 12
        : (0.005 * loanAmount) / 12;
    } else {
      return downPayment < 5
        ? (0.0075 * loanAmount) / 12
        : (0.007 * loanAmount) / 12;
    }
  } else {
    if (loanAmount <= LOAN_LIMIT) {
      return downPayment < 10
        ? (0.004 * loanAmount) / 12
        : (0.0015 * loanAmount) / 12;
    } else {
      if (downPayment < 10) {
        return (0.0065 * loanAmount) / 12;
      } else if (downPayment >= 10 && downPayment < 22) {
        return (0.004 * loanAmount) / 12;
      } else {
        return (0.0015 * loanAmount) / 12;
      }
    }
  }
}

function calculateVAFundingFee(loanAmount, downPaymentPercentage, isFirstTimeUse) {
  const downPayment = downPaymentPercentage / 100;
  const feeRates =
    isFirstTimeUse
      ? VA_FUNDING_FEE_RATES.firstTimeUse.downPayment
      : VA_FUNDING_FEE_RATES.subsequentUse.downPayment;

  if (downPayment < 0.05) {
    return calculateFundingFee(loanAmount, downPaymentPercentage, feeRates.lt5);
  } else if (downPayment >= 0.05 && downPayment < 0.1) {
    return calculateFundingFee(loanAmount, downPaymentPercentage, feeRates.gte5AndLt10);
  } else {
    return calculateFundingFee(loanAmount, downPaymentPercentage, feeRates.gte10);
  }
}

function updateFundingFee(fee) {
  fundingFee.value = fee.toFixed(2);
}

function calculateInsurance(purchasePrice) {
  return purchasePrice * INSURANCE_RATE;
}

const loanType = document.getElementById("loan-type");
const vaUse = document.getElementById("va-use");
const fundingFee = document.getElementById("funding-fee");
const purchasePrice = document.getElementById("purchase-price");
const downPayment = document.getElementById("down-payment");
const interestRate = document.getElementById("interest-rate");
const loanTerm = document.getElementById("loan-term");
const state = document.getElementById("state");
const calculateButton = document.getElementById("calculate-button");
const loanAmount = document.getElementById("loan-amount");
const principalInterest = document.getElementById("principal-interest");
const tax = document.getElementById("tax");
const monthlyPayment = document.getElementById("monthly-payment");

// Add new field for Income
const income = document.createElement("p");
income.id = "income";
document.body.appendChild(income);

// Event Listeners
const vaUseLabel = document.querySelector('label[for="va-use"]');
const fundingFeeLabel = document.querySelector('label[for="funding-fee"]');

vaUse.style.display = "none";
vaUseLabel.style.display = "none";
fundingFee.style.display = "none";
fundingFeeLabel.style.display = "none";

/**
 * Toggles the visibility of VA-specific fields based on the selected loan type.
 */
loanType.addEventListener("change", function () {
  if (loanType.value === "CONV") {
    vaUse.style.display = "none";
    vaUseLabel.style.display = "none";
    fundingFee.style.display = "none";
    fundingFeeLabel.style.display = "none";
  } else if (loanType.value === "VA") {
    vaUse.style.display = "block";
    vaUseLabel.style.display = "block";
    fundingFee.style.display = "block";
    fundingFeeLabel.style.display = "block";
  } else if (loanType.value === "FHA") {
    vaUse.style.display = "none";
    vaUseLabel.style.display = "none";
    fundingFee.style.display = "block";
    fundingFeeLabel.style.display = "block";
    updateFundingFee(calculateMIP(loanAmount.value));
  }
});

/**
 * Updates the funding fee based on VA loan usage.
 */
vaUse.addEventListener("change", function () {
  const isFirstTimeUse = vaUse.value === "first";
  const downPaymentPercentage = Number(downPayment.value);
  updateFundingFee(
    calculateVAFundingFee(loanAmount.value, downPaymentPercentage, isFirstTimeUse)
  );
});

// Mortgage Calculation
const form = document.getElementById("mortgage-form");

function PMT(rate, numPayments, principal) {
  return (principal * rate) / (1 - Math.pow(1 + rate, -numPayments));
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const purchasePriceValue = Number(purchasePrice.value);
  const downPaymentPercentage = Number(downPayment.value) / 100;
  const interestRateValue = Number(interestRate.value) / 100;
  const loanTermValue = Number(loanTerm.value);
  const stateValue = Number(state.value);
  let loanAmountValue = purchasePriceValue * (1 - downPaymentPercentage);
  let fundingFeeAmount = 0;

  if (loanType.value === "FHA") {
    fundingFeeAmount = calculateMIP(loanAmountValue);
    loanAmountValue += fundingFeeAmount;
    updateFundingFee(fundingFeeAmount);
  } else if (loanType.value === "VA") {
    const isFirstTimeUse = vaUse.value === "first";
    const downPaymentPercentage = Number(downPayment.value);
    fundingFeeAmount = calculateVAFundingFee(
      loanAmountValue,
      downPaymentPercentage,
      isFirstTimeUse
    );
    loanAmountValue += fundingFeeAmount;
    updateFundingFee(fundingFeeAmount);
  }

  // Calculate monthly payment
const monthlyInterest = PMT(interestRateValue / 12, loanTermValue * 12, loanAmountValue);
const monthlyTax = purchasePriceValue * (stateValue / 12);
let monthlyPaymentAmount = monthlyInterest + monthlyTax;

// Calculate MMIP for FHA loans
if (loanType.value === "FHA") {
  const mmipAmount = calculateMMIP(loanAmountValue, downPaymentPercentage, loanTermValue);
  monthlyPaymentAmount += mmipAmount;
  document.getElementById("mmip-display").textContent =
    "MIP: " + mmipAmount.toLocaleString("en-US", { style: "currency", currency: "USD" });
} else {
  document.getElementById("mmip-display").textContent = "";
}

// Calculate insurance
const insuranceAmount = calculateInsurance(purchasePriceValue);
monthlyPaymentAmount += insuranceAmount;

// Calculate Income
const targetIncome = monthlyPaymentAmount * 12 * 2; // Assuming 25% of gross income for housing expenses

// Update display values
document.getElementById("loan-amount").textContent =
  "Loan amount: " +
  loanAmountValue.toLocaleString("en-US", { style: "currency", currency: "USD" });
document.getElementById("principal-interest").textContent =
  "Principal and interest: " +
  monthlyInterest.toLocaleString("en-US", { style: "currency", currency: "USD" });
document.getElementById("tax").textContent =
  "Tax: " + monthlyTax.toLocaleString("en-US", { style: "currency", currency: "USD" });
document.getElementById("insuranceAmount").textContent =
  "Insurance: " + insuranceAmount.toLocaleString("en-US", { style: "currency", currency: "USD" });
document.getElementById("monthly-payment").textContent =
  "Monthly payment: " +
  monthlyPaymentAmount.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Update income
document.getElementById("income").textContent =
  "Income: " + targetIncome.toLocaleString("en-US", { style: "currency", currency: "USD" });
});