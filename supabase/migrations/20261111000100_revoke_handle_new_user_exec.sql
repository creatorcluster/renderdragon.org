-- `revoke ... from anon, authenticated` does not remove the default PUBLIC
-- grant that every function receives, so handle_new_user stayed callable.
-- It is a trigger-only function; no client role should execute it.
revoke execute on function public.handle_new_user() from public;
