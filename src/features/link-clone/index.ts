import { useMutation, useQueryClient } from '@tanstack/react-query'
import { linkApi, linkQueryKeys, type CloneLinkInput } from '@entities/link'

export function useCloneLink(shortCode: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CloneLinkInput = {}) => linkApi.clone(shortCode, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: linkQueryKeys.all() }),
  })
}
