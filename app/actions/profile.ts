'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createProfile, getMyProfile, requireSessionUser } from '@/lib/db'
import { HANDLE_ERROR_COPY, type HandleError } from '@/lib/handles'

export type ProfileResult = { ok: true } | { ok: false; message: string }

const schema = z.object({
  handle: z.string().min(2).max(40),
  displayName: z.string().max(60).optional(),
})

export async function createProfileAction(
  _prev: ProfileResult | null,
  formData: FormData,
): Promise<ProfileResult> {
  const sessionUser = await requireSessionUser()

  if (await getMyProfile(sessionUser)) redirect('/')

  const parsed = schema.safeParse({
    handle: formData.get('handle'),
    displayName: formData.get('displayName') || undefined,
  })

  if (!parsed.success) return { ok: false, message: HANDLE_ERROR_COPY.shape }

  const result = await createProfile(sessionUser, parsed.data)

  if (!result.ok) {
    // `createProfile` returns the handle-validation reason as its message.
    const copy = HANDLE_ERROR_COPY[result.message as HandleError]
    return { ok: false, message: copy ?? result.message }
  }

  redirect('/')
}
