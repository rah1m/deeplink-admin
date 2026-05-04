export { LinkForm } from './ui/link-form'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { linkApi, linkQueryKeys, type CreateLinkInput } from '@entities/link'

export function useCreateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateLinkInput) => linkApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: linkQueryKeys.all() }),
  })
}
