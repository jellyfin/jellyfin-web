/**
 * @deprecated All emby-* components are deprecated in favor of ui-primitives.
 * Please migrate to the following replacements:
 *
 * - EmbyButton → ui-primitives/Button
 * - EmbyInput → ui-primitives/Input
 * - EmbySelect → ui-primitives/Select
 * - EmbyCheckbox → ui-primitives/Checkbox
 * - EmbySlider → ui-primitives/Slider
 * - EmbySwitch → ui-primitives/Switch
 * - EmbyTextarea → Native <textarea> with custom styling
 * - EmbyTabs → ui-primitives/Tabs
 * - FavoriteButton → ui-primitives/IconButton with custom favorite logic
 * - PlayedButton → ui-primitives/IconButton with custom played logic
 * - ItemsContainer → ui-primitives/Box with custom event handling
 * - AutoTimeProgressBar → ui-primitives/Progress
 *
 * Import from ui-primitives directly instead.
 * @see src/ui-primitives
 */

export { default as EmbyInput } from './EmbyInput';
export { default as EmbySelect } from './EmbySelect';
export { default as EmbyTextarea } from './EmbyTextarea';
export { default as FavoriteButton } from './emby-ratingbutton/FavoriteButton';
export { default as PlayedButton } from './emby-playstatebutton/PlayedButton';
export { default as ItemsContainer } from './emby-itemscontainer/ItemsContainer';
export { default as AutoTimeProgressBar } from './emby-progressbar/AutoTimeProgressBar';
