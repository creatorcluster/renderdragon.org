-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Creator packs are publicly readable if approved" ON creator_packs;
DROP POLICY IF EXISTS "Users can manage their own creator packs" ON creator_packs;

-- Allow anyone to read approved creator packs
CREATE POLICY "Creator packs are publicly readable if approved" ON creator_packs
FOR SELECT
USING (status = 'approved');

-- Allow users to insert, update, and delete their own creator packs
CREATE POLICY "Users can manage their own creator packs" ON creator_packs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to review creator packs
CREATE POLICY "Admins can review creator packs" ON creator_packs
FOR UPDATE
USING (auth.jwt() ->> 'email' = 'yamura@duck.com')
WITH CHECK (auth.jwt() ->> 'email' = 'yamura@duck.com');