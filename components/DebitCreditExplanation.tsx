import React from 'react';

const DebitCreditExplanation: React.FC = () => {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-2xl font-bold text-zinc-100 mb-4">Understanding Double-Entry Accounting: Debits and Credits</h2>
      <p className="text-zinc-300 mb-4">
        ZenLedger uses a double-entry accounting system, which means every financial transaction affects at least two accounts. For every <strong>Debit</strong>, there must be an equal and opposite <strong>Credit</strong>. This system ensures that your books always remain balanced.
      </p>
      <p className="text-zinc-300 mb-4">
        While it might seem complex at first, understanding the basic rules of Debits and Credits is fundamental to accurately recording transactions.
      </p>

      <h3 className="text-xl font-semibold text-zinc-100 mb-3">The Golden Rule: What Increases What?</h3>
      <p className="text-zinc-300 mb-2">
        Think about what makes each type of account <strong>increase</strong>.
      </p>

      <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
        <li><strong>D</strong>ebits <strong>I</strong>ncrease:
          <ul className="list-circle list-inside ml-4">
            <li><strong>A</strong>ssets (e.g., Cash, Bank Accounts, Equipment, Investment Accounts)</li>
            <li><strong>E</strong>xpenses (e.g., Rent, Utilities, Salaries)</li>
          </ul>
        </li>
        <li><strong>C</strong>redits <strong>I</strong>ncrease:
          <ul className="list-circle list-inside ml-4">
            <li><strong>L</strong>iabilities (e.g., Loans Payable, Bills to Pay)</li>
            <li><strong>E</strong>quity (e.g., Owner's Investment, Retained Earnings)</li>
            <li><strong>R</strong>evenue (e.g., Sales, Service Income)</li>
          </ul>
        </li>
      </ul>
      <p className="text-zinc-300 mb-4">
        A simple mnemonic to remember this is <strong>"DEAD CLER"</strong>:
      </p>
      <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1">
        <li><strong>D</strong>ebits <strong>E</strong>xpand: <strong>A</strong>ssets, <strong>E</strong>xpenses</li>
        <li><strong>C</strong>redits <strong>E</strong>xpand: <strong>L</strong>iabilities, <strong>E</strong>quity, <strong>R</strong>evenue</li>
      </ul>
      <p className="text-zinc-300 mb-4">
        Conversely, if a Debit increases an account, then a Credit decreases it, and vice-versa.
      </p>

      <h3 className="text-xl font-semibold text-zinc-100 mb-3">Applying Debits and Credits in ZenLedger</h3>
      <p className="text-zinc-300 mb-4">
        When you use the <strong>"Advanced Entry"</strong> feature on the Journal Entries page, or the <strong>"Custom Entry"</strong> option in the Quick Add modal, you will specify accounts as either a Debit (DR) or a Credit (CR).
      </p>

      <h4 className="text-lg font-semibold text-zinc-100 mb-2">Example: Paying your electricity bill of $100 from your Cash account.</h4>
      <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-1">
        <li><strong>Identify Accounts:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>"Utilities Expense" (an Expense account)</li>
            <li>"Cash" (an Asset account)</li>
          </ul>
        </li>
        <li><strong>Determine Impact:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>Your "Utilities Expense" is <strong>increasing</strong> (you incurred an expense). According to DEAD CLER, Expenses increase with a <strong>Debit</strong>.</li>
            <li>Your "Cash" is <strong>decreasing</strong> (money is leaving your asset account). Since Assets increase with a Debit, they decrease with a <strong>Credit</strong>.</li>
          </ul>
        </li>
        <li><strong>Record in ZenLedger:</strong>
          <ul className="list-disc list-inside ml-4">
            <li><strong>Line 1:</strong>
              <ul className="list-circle list-inside ml-4">
                <li>Account: "Utilities Expense"</li>
                <li>Amount: $100</li>
                <li>Type: <strong>DR</strong> (Debit)</li>
              </ul>
            </li>
            <li><strong>Line 2:</strong>
              <ul className="list-circle list-inside ml-4">
                <li>Account: "Cash"</li>
                <li>Amount: $100</li>
                <li>Type: <strong>CR</strong> (Credit)</li>
              </ul>
            </li>
          </ul>
        </li>
      </ol>

      <h4 className="text-lg font-semibold text-zinc-100 mb-2">Example: Your aunt pays your electricity bill of $100 as a gift.</h4>
      <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-1">
        <li><strong>Identify Accounts:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>"Utilities Expense" (an Expense account)</li>
            <li>"Gift Income" (a Revenue account - you might need to create this under Account Type: Revenue)</li>
          </ul>
        </li>
        <li><strong>Determine Impact:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>Your "Utilities Expense" is <strong>increasing</strong>. This is a <strong>Debit</strong>.</li>
            <li>Your "Gift Income" is <strong>increasing</strong>. According to DEAD CLER, Revenue increases with a <strong>Credit</strong>.</li>
          </ul>
        </li>
        <li><strong>Record in ZenLedger:</strong>
          <ul className="list-disc list-inside ml-4">
            <li><strong>Line 1:</strong>
              <ul className="list-circle list-inside ml-4">
                <li>Account: "Utilities Expense"</li>
                <li>Amount: $100</li>
                <li>Type: <strong>DR</strong> (Debit)</li>
              </ul>
            </li>
            <li><strong>Line 2:</strong>
              <ul className="list-circle list-inside ml-4">
                <li>Account: "Gift Income"</li>
                <li>Amount: $100</li>
                <li>Type: <strong>CR</strong> (Credit)</li>
              </ul>
            </li>
          </ul>
        </li>
      </ol>

      <p className="text-zinc-300 mb-4">
        By consistently applying these rules, you'll ensure your financial records are accurate and provide a clear picture of your financial health.
      </p>
    </div>
  );
};

export default DebitCreditExplanation;
