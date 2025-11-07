-- Insert test users
INSERT INTO User (Alias, Email, Password, Online, CreationDate)
VALUES 
    ('pongMaster', 'pong1@example.com', 'password123', 1, DATETIME('now')),
    ('rallyKing', 'pong2@example.com', 'secret', 0, DATETIME('now')),
    ('tableQueen', 'pong3@example.com', 'abc123', 1, DATETIME('now'));

-- Insert friends
INSERT INTO Friend (User1ID, User2ID, DateBefriended)
VALUES 
    (1, 2, DATETIME('now')),
    (1, 3, DATETIME('now'));

-- Insert blocked users
INSERT INTO BlockedUser (BlockerID, BlockedID, BlockedDate)
VALUES 
    (2, 3, DATETIME('now'));

-- Insert messages
INSERT INTO Message (SenderID, ReceiverID, Message, DateTime, IsRead)
VALUES 
    (1, 2, 'Good game!', DATETIME('now'), 1),
    (2, 1, 'Thanks!', DATETIME('now'), 0);

-- Insert matches
INSERT INTO "Match" (Player1ID, Player2ID, Player1Score, Player2Score, CreationDate, WinnerID)
VALUES 
    (1, 2, 11, 5, DATETIME('now'), 1),
    (2, 3, 7, 11, DATETIME('now'), 3);

-- Insert a tournament
INSERT INTO Tournament (Name, CreationDate)
VALUES ('Autumn Pong Tournament', DATETIME('now'));

-- Add users to the tournament
INSERT INTO TournamentUser (Alias, UserID, TournamentID)
VALUES 
    ('PongMaster42', 1, 1),
    ('RallyKingX', 2, 1),
    ('TableQueenZ', 3, 1);

-- Insert a tournament match
INSERT INTO TournamentMatch (TournamentID, Player1ID, Player2ID, Player1Score, Player2Score, CreationDate, WinnerID)
VALUES 
    (1, 1, 2, 11, 9, DATETIME('now'), 1);

-- Update tournament winner
UPDATE Tournament SET WinnerID = 1 WHERE ID = 1;

-- Add a log entry
INSERT INTO Log (DateTime, Type, ServerClientID, Message)
VALUES 
    (DATETIME('now'), 1, 1001, 'Test log entry');

-- Add an invitation
INSERT INTO Invitation (SenderID, ReceiverID, Status, SentAt, MatchID)
VALUES 
    (1, 3, 0, DATETIME('now'), 1);