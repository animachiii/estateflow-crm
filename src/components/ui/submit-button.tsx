'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './button';

export interface SubmitButtonProps extends Omit<ButtonProps, 'type' | 'loading'> {
  /** Override pending state (useful when wrapping a useTransition/useActionState flow). */
  pending?: boolean;
  loadingText?: string;
}

/**
 * Submit button that automatically shows a spinner while its parent <form>
 * is submitting. Works with Server Actions, useActionState, and plain forms.
 *
 * Place inside a <form>. For useTransition flows where there is no form,
 * pass `pending` explicitly.
 */
export function SubmitButton({ pending, loadingText, children, ...props }: SubmitButtonProps) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;
  return (
    <Button type="submit" loading={isPending} loadingText={loadingText} {...props}>
      {children}
    </Button>
  );
}
