export const isAlertTriggered = (alertType: 'upper' | 'lower', threshold: number, currentPrice: number) =>
    alertType === 'upper' ? currentPrice >= threshold : currentPrice <= threshold;
