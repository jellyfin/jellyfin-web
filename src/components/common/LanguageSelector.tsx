import { useMemo } from 'react';
import { useTranslation, supportedLocales, type LocaleCode } from 'hooks/useTranslation';
import { vars } from 'styles/tokens.css';

export interface LanguageSelectorProps {
    value?: string;
    onChange?: (code: LocaleCode) => void;
    className?: string;
    showAll?: boolean;
}

export function LanguageSelector({ value, onChange, className, showAll = false }: LanguageSelectorProps) {
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
                    padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
                    borderRadius: vars.borderRadius.sm,
                    border: `1px solid ${vars.colors.divider}`,
                    background: vars.colors.surface,
                    color: vars.colors.text,
                    fontSize: vars.typography.fontSizeSm,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    minWidth: '150px'
                }}
                aria-label={t('Language')}
            >
                {sortedLocales.map(locale => (
                    <option key={locale.code} value={locale.code}>
                        {locale.name}
                    </option>
                ))}
            </select>
            {isLoading && (
                <span
                    style={{
                        marginLeft: vars.spacing.sm,
                        fontSize: vars.typography.fontSizeXs,
                        color: vars.colors.textSecondary
                    }}
                >
                    Loading...
                </span>
            )}
        </div>
    );
}
