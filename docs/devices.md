-- users = аккаунт, не ключ
create table users (
id uuid primary key,
username citext unique not null,
...
created_at timestamptz not null default now()
);

-- devices = конкретная установка приложения
create table devices (
id uuid primary key,
user_id uuid not null references users(id) on delete cascade,
device_name text not null,
status text not null default 'active', -- active / revoked
identity_public_key bytea not null,
identity_key_fingerprint bytea not null unique,
created_at timestamptz not null default now(),
revoked_at timestamptz,
last_seen_at timestamptz
);

-- signed prekeys: меняются периодически
create table device_signed_prekeys (
id bigserial primary key,
device_id uuid not null references devices(id) on delete cascade,
prekey_id bigint not null,
public_key bytea not null,
signature bytea not null,
created_at timestamptz not null default now(),
expires_at timestamptz,
rotated_at timestamptz,
unique(device_id, prekey_id)
);

-- one-time prekeys: одноразовые
create table device_one_time_prekeys (
id bigserial primary key,
device_id uuid not null references devices(id) on delete cascade,
prekey_id bigint not null,
public_key bytea not null,
created_at timestamptz not null default now(),
consumed_at timestamptz,
unique(device_id, prekey_id)
);

-- чаты
create table chats (
id uuid primary key,
chat_type text not null, -- direct / group
created_by_user_id uuid not null references users(id),
created_at timestamptz not null default now()
);

create table chat_members (
chat_id uuid not null references chats(id) on delete cascade,
user_id uuid not null references users(id) on delete cascade,
joined_at timestamptz not null default now(),
left_at timestamptz,
role text not null default 'member',
primary key (chat_id, user_id)
);

-- сообщения: сервер видит только ciphertext и routing data
create table messages (
id uuid primary key,
chat_id uuid not null references chats(id) on delete cascade,
sender_device_id uuid not null references devices(id),
created_at timestamptz not null default now(),
ciphertext bytea not null,
x3dh_header bytea,
msg_type text not null default 'message' -- message / control / sync
);

devices — главная таблица. Не users.
У каждого device свой identity key pair. Приватник живет только на устройстве.
device_signed_prekeys и device_one_time_prekeys нужны, чтобы собирать prekey bundle для X3DH. Это прямо соответствует модели Signal/Sesame.

Для device-to-device transfer нужно отдельную временную таблицу:

create table device_pairing_sessions (
id uuid primary key,
from_device_id uuid not null references devices(id) on delete cascade,
to_device_id uuid references devices(id) on delete cascade,
pairing_code_hash bytea not null,
transfer_pubkey bytea not null,
state text not null, -- pending / confirmed / expired / canceled
created_at timestamptz not null default now(),
expires_at timestamptz not null
);

Туда не надо класть никакие постоянные приватные ключи. Только временный pairing state. Сами session state / group state / backup root передавай уже через шифрованный канал между устройствами.

Практически:
users — аккаунт.
devices — ключевая сущность.
prekeys — отдельные таблицы.
messages — только ciphertext.
device_pairing_sessions — только для временного переноса состояния.

Каждый пользователь может иметь только три устройства.
