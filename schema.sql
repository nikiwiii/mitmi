create table if not exists meetings (
  id varchar(64) primary key,
  title text not null,
  description text default '',
  dates jsonb not null,
  start_hour integer not null default 8,
  end_hour integer not null default 20,
  created_at timestamp default now()
);

create table if not exists availabilities (
  id serial primary key,
  meeting_id varchar(64) references meetings(id) on delete cascade,
  user_name text not null,
  user_avatar text default '',
  slots jsonb not null default '[]'::jsonb,
  updated_at timestamp default now(),
  constraint unq_meeting_user unique (meeting_id, user_name)
);
