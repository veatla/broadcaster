Флоу: register device, link device, send message, revoke device, device transfer.

1. Register device (первое устройство)

Клиент:

генерит:
identity_keypair
signed_prekey
N one_time_prekeys
отправляет на сервер:
POST /devices/register
{
user_data,
identity_public_key,
signed_prekey,
signature,
one_time_prekeys[]
}

Сервер:

создаёт user
создаёт device
сохраняет prekeys

Результат:

device_id
session_token

2. Link device (добавление второго устройства)

Шаг 1 — инициатор (новое устройство)
генерит:
identity_keypair
ephemeral transfer key

Показывает QR:

pairing_session_id + transfer_pubkey
Шаг 2 — старое устройство

Сканирует QR → делает:

POST /device_pairing/confirm
{
pairing_session_id,
new_device_pubkey
}
Шаг 3 — D2D канал

Старое устройство:

делает ECDH с transfer_pubkey
шифрует:
session states (ratchet)
chat keys / sender keys
список чатов

Отправляет НЕ через сервер как plaintext, а:

POST /device_pairing/transfer
{
encrypted_blob
}
Шаг 4 — новое устройство
расшифровывает blob
сохраняет state
регистрирует себя как device (как в register)

3. Send message

Шаг 1 — получение получателей
GET /users/{id}/devices

получаешь список device + prekey bundle

Шаг 2 — для каждого устройства

Если нет сессии:

делаешь X3DH
создаёшь Double Ratchet

Если есть:

используешь текущий ratchet
Шаг 3 — шифрование

Для КАЖДОГО device:

ciphertext_i = encrypt(message, session_i)
Шаг 4 — отправка
POST /messages
{
chat_id,
messages: [
{ device_id, ciphertext, header }
]
}

4. Receive message

Клиент:

получает сообщение
находит session по device_id отправителя
делает:
ratchet step
decrypt

Важно:

поддерживай out-of-order (храни skipped message keys)

5. Revoke device

POST /devices/{id}/revoke

Сервер: ставит revoked_at

Клиенты:

при следующем sync:
удаляют сессии с этим устройством

Важно:
сразу после revoke делай:

session reset (new X3DH)

иначе:

старый device сможет читать будущие сообщения (если цепочка не сменилась)

6. Device-to-device transfer (ключевой flow)

Ты НЕ переносишь: identity private key ❌

Ты переносишь:

session states ✅
ratchet chains ✅
sender keys (группы) ✅
Flow
создаётся pairing session
устанавливается ephemeral ECDH
старое устройство формирует:
backup = {
sessions,
chains,
group_keys,
metadata
}
шифрует:
encrypted = AEAD(backup, shared_secret)
новое устройство:
расшифровывает
импортирует

7. Где ты ошибёшься (обязательно проверь)

Если этого не сделаешь — всё сломается:

хранение skipped message keys
обработка out-of-order сообщений
повторное использование prekeys
race conditions между устройствами
отсутствие session reset после revoke
потеря ratchet state

8. Минимальный sanity-check

Если у тебя:

один user → много devices
сообщение шифруется на каждый device
identity key никогда не покидает устройство
session state переносится только через D2D

→ ты на правильном пути
