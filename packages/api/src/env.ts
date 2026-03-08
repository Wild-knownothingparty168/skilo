export type ApiBindings = {
  DB: D1Database;
  SKILLPACK_BUCKET: R2Bucket;
  SKILLPACK_KV: KVNamespace;
};

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
  created_at: number;
};

export type PublisherUser = Pick<AuthenticatedUser, 'id' | 'username'>;

export type ApiEnv = {
  Bindings: ApiBindings;
  Variables: {
    user: AuthenticatedUser;
  };
};
