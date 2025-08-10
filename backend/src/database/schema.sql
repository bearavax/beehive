-- Beehive Wellington Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    points INTEGER DEFAULT 0,
    vote_streak INTEGER DEFAULT 0,
    last_vote_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vote options table (cafes, initiatives, routes, etc.)
CREATE TABLE vote_options (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    elo_rating REAL DEFAULT 1200.0,
    vote_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily votes table
CREATE TABLE daily_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    selected_option_id INTEGER REFERENCES vote_options(id),
    vote_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vote_date)
);

-- Vote matchups table (for tournament-style voting)
CREATE TABLE vote_matchups (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    option1_id INTEGER REFERENCES vote_options(id),
    option2_id INTEGER REFERENCES vote_options(id),
    votes_option1 INTEGER DEFAULT 0,
    votes_option2 INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partners table
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    point_cost INTEGER NOT NULL,
    quantity_available INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward redemptions table
CREATE TABLE reward_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reward_id INTEGER REFERENCES rewards(id),
    redemption_code VARCHAR(20) UNIQUE NOT NULL,
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER REFERENCES partners(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    point_reward INTEGER DEFAULT 5,
    qr_code_secret VARCHAR(255) UNIQUE NOT NULL,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event check-ins table
CREATE TABLE event_checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id),
    points_awarded INTEGER,
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- User referrals table
CREATE TABLE user_referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id),
    referred_id INTEGER REFERENCES users(id),
    points_awarded INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referrer_id, referred_id)
);

-- Friendships table
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER REFERENCES users(id),
    user2_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    connection_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);

-- User vote history sharing preferences
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    share_vote_history BOOLEAN DEFAULT false,
    show_on_leaderboard BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    receive_message_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_deleted_by_sender BOOLEAN DEFAULT false,
    is_deleted_by_receiver BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community Vision Questions table
CREATE TABLE vision_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    category VARCHAR(100), -- connectivity, infrastructure, sustainability, culture, economy
    is_active BOOLEAN DEFAULT true,
    times_asked INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vision Question Options table
CREATE TABLE vision_question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES vision_questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vision Question Responses table
CREATE TABLE vision_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    question_id INTEGER REFERENCES vision_questions(id),
    selected_option_id INTEGER REFERENCES vision_question_options(id),
    response_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id, response_date)
);

-- Indexes for performance
CREATE INDEX idx_daily_votes_user_date ON daily_votes(user_id, vote_date);
CREATE INDEX idx_daily_votes_category_date ON daily_votes(category_id, vote_date);
CREATE INDEX idx_vote_options_category ON vote_options(category_id);
CREATE INDEX idx_vote_options_elo ON vote_options(elo_rating DESC);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_event_checkins_event ON event_checkins(event_id);
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_vision_responses_user_date ON vision_responses(user_id, response_date);

-- Sample data
INSERT INTO categories (name, description) VALUES 
('Cafes', 'Best cafes in Wellington'),
('Community Initiatives', 'Local community projects and initiatives'),
('Cycling Routes', 'Popular cycling routes around Wellington'),
('City Improvements', 'Suggestions for improving Wellington'),
('Restaurants', 'Best restaurants in Wellington');

-- Sample vote options
INSERT INTO vote_options (category_id, name, description, location) VALUES 
(1, 'Prefab', 'Specialty coffee and cabinet food', 'Jessie Street'),
(1, 'Flight Coffee', 'Award-winning specialty coffee', 'Hangar'),
(1, 'Havana Coffee Works', 'Wellington coffee institution', 'Tory Street'),
(1, 'L''affare', 'Italian-style coffee', 'Various locations'),
(1, 'Mojo Coffee', 'Local coffee roaster', 'Various locations');

-- Sample vision questions
INSERT INTO vision_questions (question_text, category) VALUES 
('What would most help neighbors connect in Wellington?', 'connectivity'),
('What time of day would you most like to bump into neighbors?', 'connectivity'),
('What would make Wellington more sustainable?', 'sustainability'),
('What type of community space does Wellington need most?', 'infrastructure'),
('How could Wellington create more casual meeting opportunities?', 'connectivity'),
('What would make you feel more connected to your community?', 'connectivity'),
('What local skill-sharing would benefit Wellington most?', 'economy'),
('What transportation improvement would help Wellington most?', 'infrastructure'),
('What would encourage more local shopping in Wellington?', 'economy'),
('What green initiative should Wellington prioritize?', 'sustainability');

-- Sample vision question options
INSERT INTO vision_question_options (question_id, option_text) VALUES 
(1, 'Shared community gardens'),
(1, 'Regular block parties'),
(1, 'Neighborhood chat groups'),
(1, 'Community skill-sharing platform'),
(2, 'Early morning (6-9am)'),
(2, 'Mid-morning (9am-12pm)'),
(2, 'Afternoon (12-5pm)'),
(2, 'Evening (5-8pm)'),
(3, 'More bike lanes and paths'),
(3, 'Community composting programs'),
(3, 'Solar panel initiatives'),
(3, 'Plastic-free shopping options'),
(4, 'Co-working spaces'),
(4, 'Community workshop/makerspace'),
(4, 'Indoor sports facilities'),
(4, 'Arts and performance venue');