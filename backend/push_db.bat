@echo off
echo Starting DB Push...
call npx prisma db push --accept-data-loss
echo DB Push Finished.
