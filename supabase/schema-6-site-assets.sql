-- ===========================================================
-- ROOM FOR ANIMATIONS
-- The panel can now take a GIF, an SVG, a font or a Lottie
-- .json for the logo, the hero and the icons. They all live in
-- the product-images bucket, which until now accepted flat
-- pictures only and refused everything else with a 415.
--
-- Run this once. It changes no policy and no data: only the
-- list of types that bucket will accept, and its size limit,
-- which goes from 5 MB to 8 MB so a short animation fits.
--
-- Who may write to it is unchanged: you, signed in. Nobody else.
-- ===========================================================

update storage.buckets
   set file_size_limit = 8388608,
       allowed_mime_types = array[
         -- flat pictures
         'image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml',
         -- animations exported from After Effects or LottieFiles
         'application/json','text/json','text/plain',
         -- typefaces
         'font/woff2','font/woff','font/ttf','font/otf',
         'application/font-woff','application/font-woff2',
         'application/x-font-ttf','application/x-font-otf','application/octet-stream'
       ]
 where id = 'product-images';
