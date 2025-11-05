use anchor_lang::prelude::*;

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        poll_start: u64,
        poll_end: u64,
        description: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;

        poll.poll_id = poll_id;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.description = description;
        poll.candidate_amount = 0;

        msg!("Poll initialized with ID: {}", poll.poll_id);
        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        candidate_name: String,
        poll_id: u64,
    ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        let poll = &mut ctx.accounts.poll;

        candidate.candidate_name = candidate_name.clone();
        candidate.candidate_votes = 0;
        poll.candidate_amount += 1;

        msg!(
            "Candidate '{}' added to Poll ID: {}",
            candidate_name,
            poll.poll_id
        );
        Ok(())
    }

    pub fn vote_candidate(
        ctx: Context<VoteCandidate>,
        candidate_name: String,
        poll_id: u64,
    ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes = candidate.candidate_votes.checked_add(1).unwrap();

        msg!(
            " Vote casted for Candidate '{}' in Poll ID: {} (Total Votes: {})",
            candidate_name,
            poll_id,
            candidate.candidate_votes
        );
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + Poll::INIT_SPACE,
        seeds = [ &poll_id.to_le_bytes() ],
        bump
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,  

    #[account(
        init,
        payer = signer,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [ &poll_id.to_le_bytes(), candidate_name.as_bytes() ],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(mut)]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct VoteCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [ &poll_id.to_le_bytes() ],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [ &poll_id.to_le_bytes(), candidate_name.as_bytes() ],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(200)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}
