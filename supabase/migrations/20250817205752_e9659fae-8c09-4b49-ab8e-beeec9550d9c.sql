-- Remove failed analysis queue entries
DELETE FROM analysis_queue 
WHERE status = 'failed' 
AND id IN (
  'c60410c5-d817-4634-8c02-738bf0437a73',
  'cb42e7af-5970-4d48-b10c-78099b989083', 
  '58fbf05a-23eb-4904-b6be-159c02065e17',
  '1ba1a44b-cddb-4ab9-8559-592d7905d1b3',
  '28cd88db-a38f-4683-8219-df875cb20140',
  '41f9b5a0-155c-43f7-b1de-47e11bf49e83',
  'aea10b6b-9f04-4c54-a24e-c5a89fba5c0f',
  '6b419a86-cef8-4202-a5b1-6afb0af328ad'
);