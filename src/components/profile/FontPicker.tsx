import React, { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import { toast } from "sonner";
import { fetchFromAssetsApi } from "@/lib/assetsApi";

interface FontOption {
    id: number;
    title: string;
    filename: string;
    url: string;
}

interface RawFontOption {
    id?: unknown;
    title?: unknown;
    filename?: unknown;
    url?: unknown;
}

const isFontOption = (font: RawFontOption): font is FontOption =>
    typeof font.id === 'number' &&
    typeof font.title === 'string' &&
    typeof font.url === 'string' &&
    font.url.startsWith('https://');

interface FontPickerProps {
    value: string;
    onFontChange: (fontFamily: string, fontUrl?: string) => void;
}

const DEFAULT_FONTS = [
    { name: 'Geist Sans', value: 'geist' },
    { name: 'Geist Mono', value: 'mono' },
    { name: 'Inter', value: 'inter' },
    { name: 'Serif', value: 'serif' },
    { name: 'Pixel (VT323)', value: 'pixel' },
];

export const FontPicker: React.FC<FontPickerProps> = ({ value, onFontChange }) => {
    const [externalFonts, setExternalFonts] = useState<FontOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFonts = async () => {
            setLoading(true);
            try {
                let attempt = 0;
                const maxRetries = 2;

                while (attempt <= maxRetries) {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);

                    try {
                        const res = await fetchFromAssetsApi('/fonts', {
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        const data = await res.json();

                        if (data && Array.isArray(data.files)) {
                            const validated = (data.files as RawFontOption[])
                                .filter(isFontOption)
                                .map((font) => ({ ...font, filename: typeof font.filename === 'string' ? font.filename : font.title }));
                            setExternalFonts(validated);
                        }
                        return; // Success, exit the loop and function
                    } catch (error: unknown) {
                        clearTimeout(timeoutId);
                        if (error instanceof DOMException && error.name === 'AbortError') {
                            toast.error("Font library connection timed out");
                            break; // Stop retrying on timeout as requested (or could continue, but usually timeouts are systemic)
                        }

                        if (attempt === maxRetries) {
                            console.error("Error loading fonts:", error);
                            toast.error("Could not load external fonts");
                        } else {
                            attempt++;
                            await new Promise(r => setTimeout(r, 1000 * attempt));
                            continue;
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFonts();
    }, []);

    const handleValueChange = (newValue: string) => {
        // Check if it's a default font
        const defaultFont = DEFAULT_FONTS.find(f => f.value === newValue);
        if (defaultFont) {
            onFontChange(defaultFont.value);
            return;
        }

        // Check if it's an external font
        // Note: We might want to use ID or Title as value. 
        // Using Title as value to be consistent with how we might store it if we just stored string name,
        // but passing clean value is better.
        // Let's assume newValue matches one of the external fonts title or a unique 'ext-' prefix?
        // Actually, let's just use the title as the value for external fonts to keep it simple in the dropdown.

        const extFont = externalFonts.find(f => f.title === newValue);
        if (extFont) {
            onFontChange(extFont.title, extFont.url);
        } else {
            // Fallback
            onFontChange(newValue);
        }
    };

    return (
        <Select value={value} onValueChange={handleValueChange} disabled={loading && externalFonts.length === 0}>
            <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading fonts..." : "Select Font"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
                <SelectGroup>
                    <SelectLabel>Standard Fonts</SelectLabel>
                    {DEFAULT_FONTS.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                            {font.name}
                        </SelectItem>
                    ))}
                </SelectGroup>

                {externalFonts.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>Render Dragon Library</SelectLabel>
                        {externalFonts.map(font => (
                            <SelectItem key={font.id} value={font.title}>
                                {font.title}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}
            </SelectContent>
        </Select>
    );
};
