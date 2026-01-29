import { type LocaleCode, supportedLocales, useTranslation } from 'hooks/useTranslation';
import { useMemo } from 'react';
import { vars } from 'styles/tokens.css.ts';

export interface LanguageSelectorProps {
    value?: string;
    onChange?: (code: LocaleCode) => void;
    className?: string;
    showAll?: boolean;
}

export function LanguageSelector({
    value,
    onChange,
    className,
    showAll = false
}: LanguageSelectorProps) {
    const { currentLanguage, setLanguage, isLoading, t } = useTranslation();

    const displayValue = value ?? currentLanguage;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value as LocaleCode;
        setLanguage(code);
        onChange?.(code);
    };

    const sortedLocales = useMemo(() => {
        return [...supportedLocales].sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    return (
        <div className={className}>
            <select
                value={displayValue}
                onChange={handleChange}
                disabled={isLoading}
                style={{
                    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
                    borderRadius: vars.borderRadius.sm,
                    border: `1px solid ${vars.colors.divider}`,
                    background: vars.colors.surface,
                    color: vars.colors.text,
                    fontSize: vars.typography['3'].fontSize,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    minWidth: '150px'
                }}
                aria-label={t('Language')}
            >
                {sortedLocales.map((locale) => (
                    <option key={locale.code} value={locale.code}>
                        {locale.name}
                    </option>
                ))}
            </select>
            {isLoading && (
                <span
                    style={{
                        marginLeft: vars.spacing['4'],
                        fontSize: vars.typography['1'].fontSize,
                        color: vars.colors.textSecondary
                    }}
                >
                    Loading...
                </span>
            )}
        </div>
    );
}
