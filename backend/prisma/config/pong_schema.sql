-- tables
-- Table: BlockedUser
CREATE TABLE BlockedUser (
    ID integer NOT NULL CONSTRAINT BlockedUser_pk PRIMARY KEY AUTOINCREMENT,
    BlockerID integer NOT NULL,
    BlockedID integer NOT NULL,
    BlockedDate datetime NOT NULL,
    CONSTRAINT BlockedPair UNIQUE (BlockerID, BlockedID),
    CONSTRAINT Blocker_Match FOREIGN KEY (BlockerID)
    REFERENCES User (ID),
    CONSTRAINT Blocked_Match FOREIGN KEY (BlockedID)
    REFERENCES User (ID)
);

-- Table: Friend
CREATE TABLE Friend (
    ID integer NOT NULL CONSTRAINT Friend_pk PRIMARY KEY AUTOINCREMENT,
    User1ID integer NOT NULL,
    User2ID integer NOT NULL,
    DateBefriended datetime NOT NULL,
    CONSTRAINT UniqueFriendPair UNIQUE (User1ID, User2ID),
    CONSTRAINT Friend_User1_Match FOREIGN KEY (User1ID)
    REFERENCES User (ID),
    CONSTRAINT Friend_User2_Match FOREIGN KEY (User2ID)
    REFERENCES User (ID)
);

-- Table: Invitation
CREATE TABLE Invitation (
    ID integer NOT NULL CONSTRAINT Invitation_pk PRIMARY KEY AUTOINCREMENT,
    SenderID integer NOT NULL,
    ReceiverID integer NOT NULL,
    Status integer NOT NULL,
    SentAt datetime NOT NULL,
    RespondedAt datetime,
    MatchID integer NOT NULL,
    CONSTRAINT Invitation_Sender_Match FOREIGN KEY (SenderID)
    REFERENCES User (ID),
    CONSTRAINT Invitation_Receiver_Match FOREIGN KEY (ReceiverID)
    REFERENCES User (ID),
    CONSTRAINT Invitation_Match FOREIGN KEY (MatchID)
    REFERENCES "Match" (ID)
);

-- Table: Log
CREATE TABLE Log (
    UUID integer NOT NULL CONSTRAINT Log_pk PRIMARY KEY AUTOINCREMENT,
    DateTime datetime NOT NULL,
    Type integer NOT NULL,
    ServerClientID integer NOT NULL,
    Message text NOT NULL
);

-- Table: Match
CREATE TABLE "Match" (
    ID integer NOT NULL CONSTRAINT Match_pk PRIMARY KEY AUTOINCREMENT,
    Player1ID integer NOT NULL,
    Player2ID integer NOT NULL,
    Player1Score integer NOT NULL,
    Player2Score integer NOT NULL,
    CreationDate datetime NOT NULL,
    WinnerID integer,
    CONSTRAINT User1_Match FOREIGN KEY (Player1ID)
    REFERENCES User (ID),
    CONSTRAINT User2_Match FOREIGN KEY (Player2ID)
    REFERENCES User (ID),
    CONSTRAINT Match_User FOREIGN KEY (WinnerID)
    REFERENCES User (ID)
);

-- Table: Message
CREATE TABLE Message (
    ID integer NOT NULL CONSTRAINT Message_pk PRIMARY KEY AUTOINCREMENT,
    SenderID integer NOT NULL,
    ReceiverID integer NOT NULL,
    Message text NOT NULL,
    DateTime datetime NOT NULL,
    IsRead boolean NOT NULL,
    CONSTRAINT Sender_Match FOREIGN KEY (SenderID)
    REFERENCES User (ID),
    CONSTRAINT Receiver_Match FOREIGN KEY (ReceiverID)
    REFERENCES User (ID)
);

-- Table: Tournament
CREATE TABLE Tournament (
    ID integer NOT NULL CONSTRAINT Tournament_pk PRIMARY KEY AUTOINCREMENT,
    Name text NOT NULL,
    CreationDate datetime NOT NULL,
    WinnerID integer,
    CONSTRAINT Tournament_Winner_Match FOREIGN KEY (WinnerID)
    REFERENCES TournamentUser (ID)
);

-- Table: TournamentMatch
CREATE TABLE TournamentMatch (
    ID integer NOT NULL CONSTRAINT TournamentMatch_pk PRIMARY KEY AUTOINCREMENT,
    TournamentID integer NOT NULL,
    Player1ID integer NOT NULL,
    Player2ID integer NOT NULL,
    Player1Score integer NOT NULL,
    Player2Score integer NOT NULL,
    CreationDate datetime NOT NULL,
    WinnerID integer,
    CONSTRAINT Tournament_Match FOREIGN KEY (TournamentID)
    REFERENCES Tournament (ID),
    CONSTRAINT Player1_Tournament_Match FOREIGN KEY (Player1ID)
    REFERENCES TournamentUser (ID),
    CONSTRAINT Player2_Tournament_Match FOREIGN KEY (Player2ID)
    REFERENCES TournamentUser (ID),
    CONSTRAINT Winner_Match FOREIGN KEY (WinnerID)
    REFERENCES TournamentUser (ID)
);

-- Table: TournamentUser
CREATE TABLE TournamentUser (
    ID integer NOT NULL CONSTRAINT TournamentUser_pk PRIMARY KEY AUTOINCREMENT,
    Alias text NOT NULL,
    UserID integer NOT NULL,
    TournamentID integer NOT NULL,
    CONSTRAINT TournamentUser_Match FOREIGN KEY (UserID)
    REFERENCES User (ID),
    CONSTRAINT Tournament_To_User_Match FOREIGN KEY (TournamentID)
    REFERENCES Tournament (ID)
);

-- Table: User
CREATE TABLE User (
    ID integer NOT NULL CONSTRAINT User_pk PRIMARY KEY AUTOINCREMENT,
    Alias text NOT NULL,
    Email text NOT NULL,
    Secret2FA text NOT NULL,
    Password text,
    OauthLogin boolean NOT NULL DEFAULT 0,
    GuestLogin boolean NOT NULL DEFAULT 0,
    Online boolean NOT NULL,
    CreationDate datetime NOT NULL,
    AccountDeleteTime datetime NULL.
    GamesWon integer NOT NULL DEFAULT 0,
    ProfilePicture blob,
    CONSTRAINT Alias UNIQUE (Alias),
    CONSTRAINT Email UNIQUE (Email)
);

-- Table: JWTRefreshToken
CREATE TABLE JWTRefreshToken (
    id integer NOT NULL CONSTRAINT JWTRefreshToken_pk PRIMARY KEY AUTOINCREMENT,
    userId integer NOT NULL,
    tokenHash text NOT NULL,
    iat datetime NOT NULL,
    exp datetime NOT NULL,
    revoked boolean NOT NULL DEFAULT 0,
    CONSTRAINT JWTRefreshToken_User_Match FOREIGN KEY (userId)
    REFERENCES User (ID) ON DELETE CASCADE,
    CONSTRAINT JWTRefreshToken_User_Unique UNIQUE (userId)
);

