import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "@src/api/users";
import type { CreateUserRequest, UpdateUserRequest } from "@src/types";

const KEYS = {
  all: ["users"] as const,
  list: () => ["users", "list"] as const
};

export const useUsers = () =>
  useQuery({
    queryKey: KEYS.list(),
    queryFn: usersApi.listUsers
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => usersApi.createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all })
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username, payload }: { username: string; payload: UpdateUserRequest }) =>
      usersApi.updateUser(username, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all })
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => usersApi.deleteUser(username),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all })
  });
};
