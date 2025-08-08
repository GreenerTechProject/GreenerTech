--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Debian 14.18-1.pgdg120+1)
-- Dumped by pg_dump version 14.18 (Debian 14.18-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: statutinterventionenum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statutinterventionenum AS ENUM (
    'ENCOURS',
    'TERMINE'
);


ALTER TYPE public.statutinterventionenum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: alertes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alertes (
    id integer NOT NULL,
    id_bilan integer NOT NULL,
    status_alert integer NOT NULL,
    maladie character varying NOT NULL,
    lien_image character varying,
    x1 double precision,
    y1 double precision,
    date timestamp without time zone,
    status character varying
);


ALTER TABLE public.alertes OWNER TO postgres;

--
-- Name: alertes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alertes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alertes_id_seq OWNER TO postgres;

--
-- Name: alertes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alertes_id_seq OWNED BY public.alertes.id;


--
-- Name: autorisations_bilan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.autorisations_bilan (
    id integer NOT NULL,
    id_user integer NOT NULL,
    id_bilan integer NOT NULL
);


ALTER TABLE public.autorisations_bilan OWNER TO postgres;

--
-- Name: autorisations_bilan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.autorisations_bilan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.autorisations_bilan_id_seq OWNER TO postgres;

--
-- Name: autorisations_bilan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.autorisations_bilan_id_seq OWNED BY public.autorisations_bilan.id;


--
-- Name: autorisations_domaine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.autorisations_domaine (
    id integer NOT NULL,
    id_user integer NOT NULL,
    id_domaine integer NOT NULL
);


ALTER TABLE public.autorisations_domaine OWNER TO postgres;

--
-- Name: autorisations_domaine_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.autorisations_domaine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.autorisations_domaine_id_seq OWNER TO postgres;

--
-- Name: autorisations_domaine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.autorisations_domaine_id_seq OWNED BY public.autorisations_domaine.id;


--
-- Name: autorisations_serre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.autorisations_serre (
    id integer NOT NULL,
    id_user integer NOT NULL,
    id_serre integer NOT NULL
);


ALTER TABLE public.autorisations_serre OWNER TO postgres;

--
-- Name: autorisations_serre_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.autorisations_serre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.autorisations_serre_id_seq OWNER TO postgres;

--
-- Name: autorisations_serre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.autorisations_serre_id_seq OWNED BY public.autorisations_serre.id;


--
-- Name: bilans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bilans (
    id integer NOT NULL,
    nom character varying NOT NULL,
    id_group_cor integer NOT NULL,
    id_serre integer NOT NULL
);


ALTER TABLE public.bilans OWNER TO postgres;

--
-- Name: bilans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bilans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bilans_id_seq OWNER TO postgres;

--
-- Name: bilans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bilans_id_seq OWNED BY public.bilans.id;


--
-- Name: domaines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domaines (
    id integer NOT NULL,
    nom character varying NOT NULL,
    surface integer NOT NULL,
    center_lat double precision NOT NULL,
    center_lng double precision NOT NULL,
    id_group_cor integer NOT NULL,
    id_entreprise integer NOT NULL
);


ALTER TABLE public.domaines OWNER TO postgres;

--
-- Name: domaines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.domaines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.domaines_id_seq OWNER TO postgres;

--
-- Name: domaines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.domaines_id_seq OWNED BY public.domaines.id;


--
-- Name: entreprises; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entreprises (
    id integer NOT NULL,
    nom character varying NOT NULL,
    id_user integer NOT NULL,
    status_juridique character varying,
    adresse character varying,
    cie character varying,
    id_fiscale character varying,
    email character varying
);


ALTER TABLE public.entreprises OWNER TO postgres;

--
-- Name: entreprises_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entreprises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entreprises_id_seq OWNER TO postgres;

--
-- Name: entreprises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entreprises_id_seq OWNED BY public.entreprises.id;


--
-- Name: etat_bilans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etat_bilans (
    id integer NOT NULL,
    id_bilan integer NOT NULL,
    nombre_tomates_maladies integer,
    nombre_tomates_non_maladies integer,
    nombre_malade1 integer,
    nombre_malade2 integer,
    temperature double precision,
    humidite double precision,
    luminosite double precision,
    co2 double precision,
    rendement double precision,
    date timestamp without time zone
);


ALTER TABLE public.etat_bilans OWNER TO postgres;

--
-- Name: etat_bilans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etat_bilans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.etat_bilans_id_seq OWNER TO postgres;

--
-- Name: etat_bilans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etat_bilans_id_seq OWNED BY public.etat_bilans.id;


--
-- Name: group_cor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_cor (
    id integer NOT NULL,
    id_group_cor integer NOT NULL,
    point_x double precision NOT NULL,
    point_y double precision NOT NULL,
    ordre integer NOT NULL
);


ALTER TABLE public.group_cor OWNER TO postgres;

--
-- Name: group_cor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_cor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.group_cor_id_seq OWNER TO postgres;

--
-- Name: group_cor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_cor_id_seq OWNED BY public.group_cor.id;


--
-- Name: guide_cultures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guide_cultures (
    id integer NOT NULL,
    nom character varying NOT NULL,
    rendement double precision,
    variete character varying,
    date_debut_saison date NOT NULL,
    date_fin_saison date NOT NULL,
    nombre_de_plants integer NOT NULL,
    id_serre integer NOT NULL
);


ALTER TABLE public.guide_cultures OWNER TO postgres;

--
-- Name: guide_cultures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guide_cultures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.guide_cultures_id_seq OWNER TO postgres;

--
-- Name: guide_cultures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guide_cultures_id_seq OWNED BY public.guide_cultures.id;


--
-- Name: intervention; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intervention (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status public.statutinterventionenum NOT NULL,
    date_debut date,
    date_fin date,
    total_charges double precision,
    id_user integer NOT NULL,
    id_serre integer NOT NULL,
    id_type_tache integer NOT NULL,
    valid boolean
);


ALTER TABLE public.intervention OWNER TO postgres;

--
-- Name: intervention_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.intervention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.intervention_id_seq OWNER TO postgres;

--
-- Name: intervention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.intervention_id_seq OWNED BY public.intervention.id;


--
-- Name: missions_robot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.missions_robot (
    id integer NOT NULL,
    id_robot integer NOT NULL,
    id_serre integer NOT NULL,
    rep_jr integer,
    rep_sem integer,
    date_debut timestamp without time zone,
    date_fin timestamp without time zone,
    executed boolean
);


ALTER TABLE public.missions_robot OWNER TO postgres;

--
-- Name: missions_robot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.missions_robot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.missions_robot_id_seq OWNER TO postgres;

--
-- Name: missions_robot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.missions_robot_id_seq OWNED BY public.missions_robot.id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id integer NOT NULL,
    description character varying(255) NOT NULL,
    status character varying(50),
    date timestamp without time zone,
    id_user integer NOT NULL,
    id_intervention integer,
    type_notification character varying(50) NOT NULL
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notification_id_seq OWNER TO postgres;

--
-- Name: notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_id_seq OWNED BY public.notification.id;


--
-- Name: rapport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rapport (
    id integer NOT NULL,
    date date NOT NULL,
    description character varying(255) NOT NULL,
    lien_pdf character varying(255),
    id_serre integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.rapport OWNER TO postgres;

--
-- Name: rapport_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rapport_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rapport_id_seq OWNER TO postgres;

--
-- Name: rapport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rapport_id_seq OWNED BY public.rapport.id;


--
-- Name: robots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.robots (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    referance character varying(100)
);


ALTER TABLE public.robots OWNER TO postgres;

--
-- Name: robots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.robots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.robots_id_seq OWNER TO postgres;

--
-- Name: robots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.robots_id_seq OWNED BY public.robots.id;


--
-- Name: serres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.serres (
    id integer NOT NULL,
    nom character varying NOT NULL,
    id_group_cor integer NOT NULL,
    id_domaine integer NOT NULL
);


ALTER TABLE public.serres OWNER TO postgres;

--
-- Name: serres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.serres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.serres_id_seq OWNER TO postgres;

--
-- Name: serres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.serres_id_seq OWNED BY public.serres.id;


--
-- Name: type_tache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_tache (
    id integer NOT NULL,
    nom character varying(100) NOT NULL
);


ALTER TABLE public.type_tache OWNER TO postgres;

--
-- Name: type_tache_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_tache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.type_tache_id_seq OWNER TO postgres;

--
-- Name: type_tache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_tache_id_seq OWNED BY public.type_tache.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100),
    email character varying(120) NOT NULL,
    password character varying(255),
    role character varying(50) NOT NULL,
    birthday date,
    telephone character varying(20),
    cin character varying(50),
    id_assigned integer,
    setup_completed boolean NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    directeur_valide boolean,
    email_valide boolean,
    verification_token character varying(255),
    id_entreprise integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: alertes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertes ALTER COLUMN id SET DEFAULT nextval('public.alertes_id_seq'::regclass);


--
-- Name: autorisations_bilan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_bilan ALTER COLUMN id SET DEFAULT nextval('public.autorisations_bilan_id_seq'::regclass);


--
-- Name: autorisations_domaine id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_domaine ALTER COLUMN id SET DEFAULT nextval('public.autorisations_domaine_id_seq'::regclass);


--
-- Name: autorisations_serre id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_serre ALTER COLUMN id SET DEFAULT nextval('public.autorisations_serre_id_seq'::regclass);


--
-- Name: bilans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bilans ALTER COLUMN id SET DEFAULT nextval('public.bilans_id_seq'::regclass);


--
-- Name: domaines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaines ALTER COLUMN id SET DEFAULT nextval('public.domaines_id_seq'::regclass);


--
-- Name: entreprises id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entreprises ALTER COLUMN id SET DEFAULT nextval('public.entreprises_id_seq'::regclass);


--
-- Name: etat_bilans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_bilans ALTER COLUMN id SET DEFAULT nextval('public.etat_bilans_id_seq'::regclass);


--
-- Name: group_cor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_cor ALTER COLUMN id SET DEFAULT nextval('public.group_cor_id_seq'::regclass);


--
-- Name: guide_cultures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guide_cultures ALTER COLUMN id SET DEFAULT nextval('public.guide_cultures_id_seq'::regclass);


--
-- Name: intervention id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention ALTER COLUMN id SET DEFAULT nextval('public.intervention_id_seq'::regclass);


--
-- Name: missions_robot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions_robot ALTER COLUMN id SET DEFAULT nextval('public.missions_robot_id_seq'::regclass);


--
-- Name: notification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN id SET DEFAULT nextval('public.notification_id_seq'::regclass);


--
-- Name: rapport id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rapport ALTER COLUMN id SET DEFAULT nextval('public.rapport_id_seq'::regclass);


--
-- Name: robots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.robots ALTER COLUMN id SET DEFAULT nextval('public.robots_id_seq'::regclass);


--
-- Name: serres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.serres ALTER COLUMN id SET DEFAULT nextval('public.serres_id_seq'::regclass);


--
-- Name: type_tache id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_tache ALTER COLUMN id SET DEFAULT nextval('public.type_tache_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
dd2fc7fc496e
\.


--
-- Data for Name: alertes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alertes (id, id_bilan, status_alert, maladie, lien_image, x1, y1, date, status) FROM stdin;
1	1	1	M1	http://greenertech.com/alete1image.jpg	33.5731	-7.5898	2025-08-03 01:01:30.999912	résolue
\.


--
-- Data for Name: autorisations_bilan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.autorisations_bilan (id, id_user, id_bilan) FROM stdin;
1	1	1
\.


--
-- Data for Name: autorisations_domaine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.autorisations_domaine (id, id_user, id_domaine) FROM stdin;
1	1	1
\.


--
-- Data for Name: autorisations_serre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.autorisations_serre (id, id_user, id_serre) FROM stdin;
1	1	1
\.


--
-- Data for Name: bilans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bilans (id, nom, id_group_cor, id_serre) FROM stdin;
1	Bilan1	3	1
2	Bilan2	4	1
\.


--
-- Data for Name: domaines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domaines (id, nom, surface, center_lat, center_lng, id_group_cor, id_entreprise) FROM stdin;
1	Domaine Central	4	34.123	-6.789	1	1
\.


--
-- Data for Name: entreprises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entreprises (id, nom, id_user, status_juridique, adresse, cie, id_fiscale, email) FROM stdin;
1	AgriTech Maroc	1	SARL	4 Rue 321	SARL	IF123456	email@gmail.com
\.


--
-- Data for Name: etat_bilans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etat_bilans (id, id_bilan, nombre_tomates_maladies, nombre_tomates_non_maladies, nombre_malade1, nombre_malade2, temperature, humidite, luminosite, co2, rendement, date) FROM stdin;
1	1	2	10	1	1	28.5	70	800	300	16	2025-08-03 01:00:32.583078
\.


--
-- Data for Name: group_cor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_cor (id, id_group_cor, point_x, point_y, ordre) FROM stdin;
1	1	34.123	-6.789	1
2	1	34.124	-6.79	2
3	1	34.125	-6.791	3
4	2	34.123	-6.789	1
5	2	34.124	-6.79	2
6	2	34.125	-6.791	3
7	3	34.123	-6.789	1
8	3	34.124	-6.79	2
9	3	34.125	-6.791	3
10	4	34.123	-6.789	1
11	4	34.124	-6.79	2
12	4	34.125	-6.791	3
\.


--
-- Data for Name: guide_cultures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guide_cultures (id, nom, rendement, variete, date_debut_saison, date_fin_saison, nombre_de_plants, id_serre) FROM stdin;
1	Tomates Cerises	28	Cherry Sweet	2025-06-01	2025-09-15	1200	1
\.


--
-- Data for Name: intervention; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.intervention (id, description, status, date_debut, date_fin, total_charges, id_user, id_serre, id_type_tache, valid) FROM stdin;
1	Inspection des systèmes de ventilation	ENCOURS	2025-08-17	\N	800	2	1	1	f
2	Inspection des systèmes de ventilation	ENCOURS	2025-08-17	\N	800	3	1	1	t
\.


--
-- Data for Name: missions_robot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.missions_robot (id, id_robot, id_serre, rep_jr, rep_sem, date_debut, date_fin, executed) FROM stdin;
1	1	1	0	0	2025-08-05 13:33:00	2025-08-06 13:33:00	f
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (id, description, status, date, id_user, id_intervention, type_notification) FROM stdin;
1	Nouvelle intervention à valider : Inspection des systèmes de ventilation	non_vue	2025-08-03 01:22:50.996363	2	2	compte_technicien
2	Votre intervention 'Inspection des systèmes de ventilation' a été validée.	non_vue	2025-08-03 01:25:54.85851	3	2	compte_technicien
\.


--
-- Data for Name: rapport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rapport (id, date, description, lien_pdf, id_serre, user_id) FROM stdin;
\.


--
-- Data for Name: robots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.robots (id, nom, referance) FROM stdin;
1	Robot 1	abcabc46-58c1-4531-b88f-99d3288bfabc
\.


--
-- Data for Name: serres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.serres (id, nom, id_group_cor, id_domaine) FROM stdin;
1	Serre Central	2	1
\.


--
-- Data for Name: type_tache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_tache (id, nom) FROM stdin;
1	Palissage
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, birthday, telephone, cin, id_assigned, setup_completed, created_at, updated_at, directeur_valide, email_valide, verification_token, id_entreprise) FROM stdin;
1	directeur	directeur@gmail.com	scrypt:32768:8:1$rcVxsphM7L5kueeB$19b24046cbdd06eb5de2e87138567b1a8d1cf3bdb2e84d50a98ce555bb1a0a9b5c0f923577344fb6eb3198d942563df97143cf983bcead85782c9a3bc64243a6	directeur	\N	\N	\N	\N	t	2025-08-03 00:33:30.761993	2025-08-03 00:34:33.48069	t	t	\N	1
2	technicien_superieur	technicien_superieur@gmail.com	scrypt:32768:8:1$rcVxsphM7L5kueeB$19b24046cbdd06eb5de2e87138567b1a8d1cf3bdb2e84d50a98ce555bb1a0a9b5c0f923577344fb6eb3198d942563df97143cf983bcead85782c9a3bc64243a6	technicien_superieur	\N	\N	\N	1	t	2025-08-03 00:52:12.750209	2025-08-03 01:17:18.380698	t	t	\N	1
3	technicien	technicien@gmail.com	scrypt:32768:8:1$rcVxsphM7L5kueeB$19b24046cbdd06eb5de2e87138567b1a8d1cf3bdb2e84d50a98ce555bb1a0a9b5c0f923577344fb6eb3198d942563df97143cf983bcead85782c9a3bc64243a6	technicien	\N	\N	\N	2	t	2025-08-03 00:55:31.168334	2025-08-03 01:17:31.852935	t	t	\N	1
\.


--
-- Name: alertes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alertes_id_seq', 1, true);


--
-- Name: autorisations_bilan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.autorisations_bilan_id_seq', 1, true);


--
-- Name: autorisations_domaine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.autorisations_domaine_id_seq', 1, true);


--
-- Name: autorisations_serre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.autorisations_serre_id_seq', 1, true);


--
-- Name: bilans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bilans_id_seq', 2, true);


--
-- Name: domaines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domaines_id_seq', 1, true);


--
-- Name: entreprises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entreprises_id_seq', 1, true);


--
-- Name: etat_bilans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etat_bilans_id_seq', 1, true);


--
-- Name: group_cor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_cor_id_seq', 12, true);


--
-- Name: guide_cultures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guide_cultures_id_seq', 1, true);


--
-- Name: intervention_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intervention_id_seq', 2, true);


--
-- Name: missions_robot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.missions_robot_id_seq', 1, true);


--
-- Name: notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_id_seq', 2, true);


--
-- Name: rapport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rapport_id_seq', 1, false);


--
-- Name: robots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.robots_id_seq', 1, true);


--
-- Name: serres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.serres_id_seq', 1, true);


--
-- Name: type_tache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_tache_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alertes alertes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertes
    ADD CONSTRAINT alertes_pkey PRIMARY KEY (id);


--
-- Name: autorisations_bilan autorisations_bilan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_bilan
    ADD CONSTRAINT autorisations_bilan_pkey PRIMARY KEY (id);


--
-- Name: autorisations_domaine autorisations_domaine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_domaine
    ADD CONSTRAINT autorisations_domaine_pkey PRIMARY KEY (id);


--
-- Name: autorisations_serre autorisations_serre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_serre
    ADD CONSTRAINT autorisations_serre_pkey PRIMARY KEY (id);


--
-- Name: bilans bilans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bilans
    ADD CONSTRAINT bilans_pkey PRIMARY KEY (id);


--
-- Name: domaines domaines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaines
    ADD CONSTRAINT domaines_pkey PRIMARY KEY (id);


--
-- Name: entreprises entreprises_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entreprises
    ADD CONSTRAINT entreprises_pkey PRIMARY KEY (id);


--
-- Name: etat_bilans etat_bilans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_bilans
    ADD CONSTRAINT etat_bilans_pkey PRIMARY KEY (id);


--
-- Name: group_cor group_cor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_cor
    ADD CONSTRAINT group_cor_pkey PRIMARY KEY (id);


--
-- Name: guide_cultures guide_cultures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guide_cultures
    ADD CONSTRAINT guide_cultures_pkey PRIMARY KEY (id);


--
-- Name: intervention intervention_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_pkey PRIMARY KEY (id);


--
-- Name: missions_robot missions_robot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions_robot
    ADD CONSTRAINT missions_robot_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: rapport rapport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rapport
    ADD CONSTRAINT rapport_pkey PRIMARY KEY (id);


--
-- Name: robots robots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.robots
    ADD CONSTRAINT robots_pkey PRIMARY KEY (id);


--
-- Name: serres serres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.serres
    ADD CONSTRAINT serres_pkey PRIMARY KEY (id);


--
-- Name: type_tache type_tache_nom_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_tache
    ADD CONSTRAINT type_tache_nom_key UNIQUE (nom);


--
-- Name: type_tache type_tache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_tache
    ADD CONSTRAINT type_tache_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_entreprises_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_entreprises_id ON public.entreprises USING btree (id);


--
-- Name: alertes alertes_id_bilan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertes
    ADD CONSTRAINT alertes_id_bilan_fkey FOREIGN KEY (id_bilan) REFERENCES public.bilans(id);


--
-- Name: autorisations_bilan autorisations_bilan_id_bilan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_bilan
    ADD CONSTRAINT autorisations_bilan_id_bilan_fkey FOREIGN KEY (id_bilan) REFERENCES public.bilans(id);


--
-- Name: autorisations_bilan autorisations_bilan_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_bilan
    ADD CONSTRAINT autorisations_bilan_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: autorisations_domaine autorisations_domaine_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_domaine
    ADD CONSTRAINT autorisations_domaine_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaines(id);


--
-- Name: autorisations_domaine autorisations_domaine_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_domaine
    ADD CONSTRAINT autorisations_domaine_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: autorisations_serre autorisations_serre_id_serre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_serre
    ADD CONSTRAINT autorisations_serre_id_serre_fkey FOREIGN KEY (id_serre) REFERENCES public.serres(id);


--
-- Name: autorisations_serre autorisations_serre_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autorisations_serre
    ADD CONSTRAINT autorisations_serre_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: bilans bilans_id_serre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bilans
    ADD CONSTRAINT bilans_id_serre_fkey FOREIGN KEY (id_serre) REFERENCES public.serres(id);


--
-- Name: domaines domaines_id_entreprise_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domaines
    ADD CONSTRAINT domaines_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id);


--
-- Name: entreprises entreprises_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entreprises
    ADD CONSTRAINT entreprises_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: etat_bilans etat_bilans_id_bilan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etat_bilans
    ADD CONSTRAINT etat_bilans_id_bilan_fkey FOREIGN KEY (id_bilan) REFERENCES public.bilans(id);


--
-- Name: guide_cultures guide_cultures_id_serre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guide_cultures
    ADD CONSTRAINT guide_cultures_id_serre_fkey FOREIGN KEY (id_serre) REFERENCES public.serres(id);


--
-- Name: intervention intervention_id_serre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_id_serre_fkey FOREIGN KEY (id_serre) REFERENCES public.serres(id);


--
-- Name: intervention intervention_id_type_tache_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_id_type_tache_fkey FOREIGN KEY (id_type_tache) REFERENCES public.type_tache(id);


--
-- Name: intervention intervention_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervention
    ADD CONSTRAINT intervention_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: missions_robot missions_robot_id_robot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions_robot
    ADD CONSTRAINT missions_robot_id_robot_fkey FOREIGN KEY (id_robot) REFERENCES public.robots(id);


--
-- Name: missions_robot missions_robot_id_serre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions_robot
    ADD CONSTRAINT missions_robot_id_serre_fkey FOREIGN KEY (id_serre) REFERENCES public.serres(id);


--
-- Name: notification notification_id_intervention_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_id_intervention_fkey FOREIGN KEY (id_intervention) REFERENCES public.intervention(id);


--
-- Name: notification notification_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: rapport rapport_id_serre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rapport
    ADD CONSTRAINT rapport_id_serre_fkey FOREIGN KEY (id_serre) REFERENCES public.serres(id);


--
-- Name: rapport rapport_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rapport
    ADD CONSTRAINT rapport_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: serres serres_id_domaine_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.serres
    ADD CONSTRAINT serres_id_domaine_fkey FOREIGN KEY (id_domaine) REFERENCES public.domaines(id);


--
-- Name: users users_id_assigned_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_assigned_fkey FOREIGN KEY (id_assigned) REFERENCES public.users(id);


--
-- Name: users users_id_entreprise_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id);


--
-- PostgreSQL database dump complete
--

