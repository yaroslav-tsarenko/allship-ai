ALTER TABLE public.dispute ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.dispute FROM anon, authenticated';
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'realtime' AND table_name = 'messages')
     AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'auth' AND p.proname = 'jwt') THEN
    EXECUTE 'DROP POLICY IF EXISTS allship_topic_read ON realtime.messages';
    EXECUTE $p$
      CREATE POLICY allship_topic_read ON realtime.messages
      FOR SELECT TO authenticated
      USING (
        realtime.messages.extension = 'broadcast'
        AND realtime.topic() IN (SELECT jsonb_array_elements_text(coalesce(auth.jwt() -> 'topics', '[]'::jsonb)))
      )
    $p$;
  END IF;
END $$;
