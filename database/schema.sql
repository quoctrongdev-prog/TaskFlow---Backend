-- Bảng user
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng workspaces
CREATE TABLE workspaces (
    workspace_id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_workspaces_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- Bảng workspace members
CREATE TABLE workspace_members (
    workspace_member_id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by UUID,

    CONSTRAINT uq_workspace_member
        UNIQUE (workspace_id, user_id),

    CONSTRAINT chk_workspace_member_role
        CHECK (role IN ('Admin', 'Member')),

    CONSTRAINT fk_workspace_members_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(workspace_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_workspace_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_workspace_members_invited_by
        FOREIGN KEY (invited_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- Bảng workspace invitations 
CREATE TABLE workspace_invitations (
    invitation_id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    invited_by UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_workspace_invitation_role
        CHECK (role IN ('Admin', 'Member')),

    CONSTRAINT chk_workspace_invitation_status
        CHECK (
            status IN (
                'Pending',
                'Accepted',
                'Expired',
                'Cancelled'
            )
        ),

    CONSTRAINT fk_workspace_invitations_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(workspace_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_workspace_invitations_invited_by
        FOREIGN KEY (invited_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

-- Bảng projects
CREATE TABLE projects (
    project_id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Planning',
    start_date DATE,
    end_date DATE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_project_status
        CHECK (
            status IN (
                'Planning',
                'In_Progress',
                'On_Hold',
                'Completed',
                'Cancelled'
            )
        ),

    CONSTRAINT chk_project_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        ),

    CONSTRAINT fk_projects_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(workspace_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- Bảng refresh tokens
CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Bảng password reset tokens
CREATE TABLE password_reset_tokens (
    reset_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Bảng tasks
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'Medium',
    status VARCHAR(20) NOT NULL DEFAULT 'Todo',
    assignee_id UUID,
    created_by UUID NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_task_priority
        CHECK (
            priority IN (
                'Low',
                'Medium',
                'High',
                'Urgent'
            )
        ),

    CONSTRAINT chk_task_status
        CHECK (
            status IN (
                'Todo',
                'In_Progress',
                'Review',
                'Done',
                'Cancelled'
            )
        ),

    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_tasks_assignee
        FOREIGN KEY (assignee_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_tasks_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- Bảng comments
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_comments_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(task_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- Indexes: Giúp tìm dữ liệu nhanh hơn
CREATE INDEX idx_workspace_members_workspace_id
    ON workspace_members(workspace_id);

CREATE INDEX idx_workspace_members_user_id
    ON workspace_members(user_id);

CREATE INDEX idx_workspace_invitations_workspace_id
    ON workspace_invitations(workspace_id);

CREATE INDEX idx_workspace_invitations_email
    ON workspace_invitations(email);

CREATE INDEX idx_projects_workspace_id
    ON projects(workspace_id);

CREATE INDEX idx_tasks_project_id
    ON tasks(project_id);

CREATE INDEX idx_tasks_assignee_id
    ON tasks(assignee_id);

CREATE INDEX idx_comments_task_id
    ON comments(task_id);

CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

CREATE INDEX idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id);