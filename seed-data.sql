-- ============================================================================
-- JAJE CINÉ - SEED COMPATIBLE AVEC TON SCHÉMA (UUID + colonnes exactes)
-- Ne touche PAS à auth.users ni profiles
-- ============================================================================

begin;

truncate table reservation_seats cascade;
truncate table reservations cascade;
truncate table showtimes cascade;
truncate table seats cascade;
truncate table seat_zones cascade;
truncate table rooms cascade;
truncate table movies cascade;

-- ROOMS
insert into rooms (id, name, capacity, rows, seats_per_row, screen_type, sound_system, accessibility_features, status)
values
  (gen_random_uuid(), 'Salle 1 - Premium', 160, 10, 16, 'IMAX', 'Dolby Atmos', array['Rampe accès','Sièges PMR'], 'ACTIVE'),
  (gen_random_uuid(), 'Salle 2 - Standard', 160, 10, 16, '4K Digital', 'Surround 7.1', array['Rampe accès','Sièges PMR'], 'ACTIVE'),
  (gen_random_uuid(), 'Salle 3 - VIP', 80, 8, 10, '4K Digital', 'Dolby Atmos', array['Rampe accès','Sièges PMR'], 'ACTIVE');

-- MOVIES
insert into movies (id, title, original_title, synopsis, director, actors, genre, duration_minutes, release_date, rating, language, subtitles, poster_url, trailer_url, status)
values
  (gen_random_uuid(), 'Avatar : La Voie de l''Eau', 'Avatar: The Way of Water',
    'Jake Sully et Neytiri protègent leur famille dans un nouveau chapitre sur Pandora.',
    'James Cameron', 'Sam Worthington, Zoe Saldana', 'Science-Fiction', 192, '2022-12-14', 'PG-13',
    'Anglais', 'Français, Créole', null, null, 'A_L_AFFICHE'),

  (gen_random_uuid(), 'Top Gun : Maverick', 'Top Gun: Maverick',
    'Maverick forme une nouvelle génération de pilotes pour une mission à haut risque.',
    'Joseph Kosinski', 'Tom Cruise, Miles Teller', 'Action', 131, '2022-05-27', 'PG-13',
    'Anglais', 'Français, Créole', null, null, 'A_L_AFFICHE'),

  (gen_random_uuid(), 'Oppenheimer', 'Oppenheimer',
    'Le destin du physicien J. Robert Oppenheimer et la création de la bombe atomique.',
    'Christopher Nolan', 'Cillian Murphy, Emily Blunt', 'Drame', 180, '2023-07-21', 'R',
    'Anglais', 'Français', null, null, 'A_L_AFFICHE');

-- SEAT ZONES
insert into seat_zones (id, room_id, name, color, price_htg, row_start, row_end)
select
  gen_random_uuid(),
  r.id,
  z.zone_name,
  z.color,
  z.price,
  z.row_start,
  z.row_end
from rooms r
cross join (values
  ('Premium',  '#D4AF37', 800::numeric, 'A', 'C'),
  ('Standard', '#4B5563', 600::numeric, 'D', 'G'),
  ('Eco',      '#1F2937', 400::numeric, 'H', 'J')
) as z(zone_name, color, price, row_start, row_end);

-- SEATS
do $$
declare
  room_rec record;
  row_i int;
  seat_i int;
  row_letter text;
  zone_id uuid;
begin
  for room_rec in select id, rows, seats_per_row from rooms loop
    for row_i in 1..room_rec.rows loop
      row_letter := chr(64 + row_i);

      select sz.id into zone_id
      from seat_zones sz
      where sz.room_id = room_rec.id
        and row_letter between sz.row_start and sz.row_end
      order by sz.price_htg desc
      limit 1;

      if zone_id is null then
        select sz.id into zone_id from seat_zones sz where sz.room_id = room_rec.id limit 1;
      end if;

      for seat_i in 1..room_rec.seats_per_row loop
        insert into seats (id, room_id, zone_id, row_letter, seat_number, status, is_wheelchair_accessible)
        values (
          gen_random_uuid(),
          room_rec.id,
          zone_id,
          row_letter,
          seat_i,
          'AVAILABLE',
          (row_letter = 'H' and seat_i in (1,2,15,16))
        );
      end loop;
    end loop;
  end loop;
end $$;

-- SHOWTIMES
with pairs as (
  select
    (select id from movies order by title limit 1) as movie1,
    (select id from movies order by title offset 1 limit 1) as movie2,
    (select id from movies order by title offset 2 limit 1) as movie3,
    (select id from rooms  order by name  limit 1) as room1,
    (select id from rooms  order by name  offset 1 limit 1) as room2,
    (select id from rooms  order by name  offset 2 limit 1) as room3
)
insert into showtimes (id, movie_id, room_id, show_date, show_time, base_price_htg, multiplier, language)
select
  gen_random_uuid(),
  case when i % 3 = 0 then p.movie1
       when i % 3 = 1 then p.movie2
       else p.movie3 end,
  case when i % 3 = 0 then p.room1
       when i % 3 = 1 then p.room2
       else p.room3 end,
  (current_date + (i/3))::date,
  case when i % 3 = 0 then time '14:00'
       when i % 3 = 1 then time '18:30'
       else time '21:00' end,
  case when i % 3 = 0 then 600::numeric
       when i % 3 = 1 then 500::numeric
       else 700::numeric end,
  1.0::numeric,
  'Français'
from generate_series(0, 41) as s(i)
cross join pairs p;

-- RESERVATIONS + RESERVATION_SEATS
do $$
declare
  v_user_id uuid;
  v_user_email text;
  v_user_name text;

  st1 record;
  st2 record;
  seat1 uuid;
  seat2 uuid;
  seat3 uuid;
  res1 uuid;
  res2 uuid;
begin
  select p.id, p.email, (p.first_name || ' ' || p.last_name)
  into v_user_id, v_user_email, v_user_name
  from profiles p
  order by created_at desc nulls last
  limit 1;

  select * into st1 from showtimes where show_date >= current_date order by show_date, show_time limit 1;
  select * into st2 from showtimes where show_date >= current_date order by show_date, show_time offset 1 limit 1;

  select s.id into seat1 from seats s where s.room_id = st1.room_id order by s.row_letter, s.seat_number limit 1;
  select s.id into seat2 from seats s where s.room_id = st1.room_id order by s.row_letter, s.seat_number offset 1 limit 1;
  select s.id into seat3 from seats s where s.room_id = st2.room_id order by s.row_letter, s.seat_number limit 1;

  -- reservation 1 (CONFIRMED/PAID)
  res1 := gen_random_uuid();
  insert into reservations (
    id, confirmation_code, user_id, showtime_id,
    guest_email, guest_phone, guest_name,
    total_seats, total_price_htg,
    status, payment_status, payment_method, transaction_reference
  ) values (
    res1,
    'JC-' || to_char(now(), 'YYYYMMDD') || '-0001',
    v_user_id,
    st1.id,
    case when v_user_id is null then 'guest1@jajecine.ht' else null end,
    case when v_user_id is null then '+50900000000' else null end,
    case when v_user_id is null then 'Client Invité' else null end,
    2,
    1200::numeric,
    'CONFIRMED',
    'PAID',
    'MONCASH',
    'MC-' || floor(random()*1000000000)::bigint::text
  );

  insert into reservation_seats (id, reservation_id, seat_id, showtime_id, price_htg)
  values
    (gen_random_uuid(), res1, seat1, st1.id, 600::numeric),
    (gen_random_uuid(), res1, seat2, st1.id, 600::numeric);

  -- reservation 2 (PENDING/TO_PAY)
  res2 := gen_random_uuid();
  insert into reservations (
    id, confirmation_code, user_id, showtime_id,
    guest_email, guest_phone, guest_name,
    total_seats, total_price_htg,
    status, payment_status, payment_method
  ) values (
    res2,
    'JC-' || to_char(now(), 'YYYYMMDD') || '-0002',
    v_user_id,
    st2.id,
    case when v_user_id is null then 'guest2@jajecine.ht' else null end,
    case when v_user_id is null then '+50900000001' else null end,
    case when v_user_id is null then 'Client Invité 2' else null end,
    1,
    500::numeric,
    'PENDING',
    'TO_PAY',
    'NATCASH'
  );

  insert into reservation_seats (id, reservation_id, seat_id, showtime_id, price_htg)
  values
    (gen_random_uuid(), res2, seat3, st2.id, 500::numeric);
end $$;

commit;