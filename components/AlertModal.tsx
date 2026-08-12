'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import SelectField from '@/components/forms/SelectField';
import { ALERT_TYPE_OPTIONS } from '@/lib/constants';
import { createAlert, updateAlert } from '@/lib/actions/alert.actions';

const EMPTY_ALERT: AlertData = {
    symbol: '',
    company: '',
    alertName: '',
    alertType: 'upper',
    threshold: '',
};

const AlertModal = ({ alertId, alertData, action = 'Create', open, setOpen }: AlertModalProps) => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AlertData>({ defaultValues: alertData ?? EMPTY_ALERT });

    useEffect(() => {
        if (open) reset(alertData ?? EMPTY_ALERT);
    }, [open, alertData, reset]);

    const onSubmit = async (data: AlertData) => {
        const result = alertId ? await updateAlert(alertId, data) : await createAlert(data);

        if (!result.success) {
            toast.error(result.error ?? 'Something went wrong');
            return;
        }

        toast.success(alertId ? 'Alert updated' : 'Alert created');
        setOpen(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="alert-dialog">
                <DialogHeader>
                    <DialogTitle className="alert-title">{action} Price Alert</DialogTitle>
                    <DialogDescription>
                        {alertData?.company ? `${alertData.company} (${alertData.symbol})` : 'Set a price alert for this stock'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <input type="hidden" {...register('symbol')} />
                    <input type="hidden" {...register('company')} />

                    <InputField
                        name="alertName"
                        label="Alert Name"
                        placeholder="e.g. Buy the dip"
                        register={register}
                        error={errors.alertName}
                        validation={{ required: 'Alert name is required' }}
                    />
                    <SelectField
                        name="alertType"
                        label="Condition"
                        placeholder="Select condition"
                        options={ALERT_TYPE_OPTIONS}
                        control={control}
                        error={errors.alertType}
                        required
                    />
                    <InputField
                        name="threshold"
                        label="Threshold Price (₹)"
                        placeholder="e.g. 15000"
                        type="number"
                        register={register}
                        error={errors.threshold}
                        validation={{
                            required: 'Threshold price is required',
                            min: { value: 0.01, message: 'Must be greater than 0' },
                        }}
                    />

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full">
                            {isSubmitting ? 'Saving...' : action === 'Edit' ? 'Save Changes' : 'Create Alert'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AlertModal;
