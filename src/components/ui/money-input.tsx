import { useState, useEffect } from "react";

interface MoneyInputProps {
    value?: number | string;
    onValueChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    currencySymbol?: string;
    disabled?: boolean;
    required?: boolean;
    min?: number;
}

export function MoneyInput({
    value,
    onValueChange,
    placeholder = "0.00",
    className = "",
    currencySymbol = "$",
    disabled = false,
    required = false,
    min
}: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState("");

    // Format number to currency string (e.g. 10000 -> 10.000)
    const formatValue = (val: number | string | undefined): string => {
        if (val === undefined || val === null || val === "") return "";

        // Convert to string and handle decimals
        // Expect input val to be a standard number (10000.50)
        const parts = val.toString().split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        let formatted = integerPart;
        if (parts.length > 1) {
            formatted += "," + parts[1]; // Use comma for decimal separator in display
        }
        return formatted;
    };

    // Sync external value to display value
    useEffect(() => {
        if (value !== undefined && value !== null) {
            // Avoid re-formatting if the display value matches the number (handling typing float)
            // But here we just sync. The issue of cursor jumping might happen if we natively accept formatted input.
            // Let's rely on the fact that parent passes the NUMBER.

            // We need to be careful not to override "10.000," while user is typing.
            // We can check if the current displayValue parses to the same number.

            const currentNumeric = parseCurrency(displayValue);
            if (currentNumeric !== Number(value)) {
                setDisplayValue(formatValue(value));
            }
        } else {
            setDisplayValue("");
        }
    }, [value]);

    const parseCurrency = (val: string): number => {
        // Remove dots (thousands) and replace comma with dot (decimal)
        const cleanVal = val.replace(/\./g, "").replace(",", ".");
        return cleanVal === "" ? 0 : Number(cleanVal);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;

        // Allow only numbers and comma
        // Remove anything that is not digit or comma
        let cleanInput = input.replace(/[^0-9,]/g, "");

        // Prevent multiple commas
        const commaCount = (cleanInput.match(/,/g) || []).length;
        if (commaCount > 1) {
            // Keep only first comma
            const parts = cleanInput.split(",");
            cleanInput = parts[0] + "," + parts.slice(1).join("");
        }

        // Format integer part
        const parts = cleanInput.split(",");
        const integerPart = parts[0].replace(/\./g, ""); // strip existing dots to re-format

        // Re-add dots to integer part
        const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        let newDisplayValue = formattedInt;
        if (parts.length > 1) {
            newDisplayValue += "," + parts[1];
        } else if (input.endsWith(",")) {
            // User just typed comma
            newDisplayValue += ",";
        }

        setDisplayValue(newDisplayValue);
        onValueChange(parseCurrency(newDisplayValue));
    };

    return (
        <div className="relative">
            {currencySymbol && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold sm:text-sm">{currencySymbol}</span>
                </div>
            )}
            <input
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={`pl-7 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full bg-background text-foreground ${className}`}
            />
        </div>
    );
}
