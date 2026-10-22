create table if not exists users (
  id varchar(64) primary key,
  username text not null,
  password_hash text not null,
  avatar text default 'User',
  created_at timestamp default now()
);

create unique index if not exists unq_users_username on users (lower(username));

create table if not exists meetings (
  id varchar(64) primary key,
  title text not null,
  description text default '',
  dates jsonb not null,
  start_hour integer not null default 8,
  end_hour integer not null default 20,
  owner_id varchar(64),
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

create table if not exists meeting_members (
  meeting_id varchar(64) references meetings(id) on delete cascade,
  user_id varchar(64) references users(id) on delete cascade,
  joined_at timestamp default now(),
  primary key (meeting_id, user_id)
);
