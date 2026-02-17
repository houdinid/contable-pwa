import { useState, useEffect } from "react";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number | string;
    onValueChange: (value: number) => void;
    currencySymbol?: string;
}

export function MoneyInput({
    value,
    onValueChange,
    placeholder = "0.00",
    className = "",
    currencySymbol = "$",
    disabled = false,
    required = false,
    min,
    ...props
}: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState("");

    // Check if value behaves like a number for initial state
    const safeValue = value === undefined || value === null ? "" : value;

    // Format number to currency string (e.g. 10000 -> 10.000)
    const formatValue = (val: number | string): string => {
        if (val === "") return "";

        const parts = val.toString().split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        let formatted = integerPart;
        if (parts.length > 1) {
            formatted += "," + parts[1];
        }
        return formatted;
    };

    // Sync external value to display value
    useEffect(() => {
        if (value !== undefined && value !== null) {
            const currentNumeric = parseCurrency(displayValue);
            // Only update if there is a real difference to avoid cursor jumps
            if (currentNumeric !== Number(value)) {
                setDisplayValue(formatValue(value));
            }
        } else {
            if (displayValue !== "") setDisplayValue("");
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    const parseCurrency = (val: string): number => {
        const cleanVal = val.replace(/\./g, "").replace(",", ".");
        return cleanVal === "" ? 0 : Number(cleanVal);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;
        let cleanInput = input.replace(/[^0-9,]/g, "");

        const commaCount = (cleanInput.match(/,/g) || []).length;
        if (commaCount > 1) {
            const parts = cleanInput.split(",");
            cleanInput = parts[0] + "," + parts.slice(1).join("");
        }

        const parts = cleanInput.split(",");
        const integerPart = parts[0].replace(/\./g, "");
        const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        let newDisplayValue = formattedInt;
        if (parts.length > 1) {
            newDisplayValue += "," + parts[1];
        } else if (input.endsWith(",")) {
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
                {...props}
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
