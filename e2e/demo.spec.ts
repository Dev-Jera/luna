import { expect, test } from '@playwright/test'

test('public landing routes visitors to registration, sign-in, and about pages', async ({ page }) => {
  await page.route('**/api/auth/session/', route =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  )

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Talk to Luna AI' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Find your person' })).toBeVisible()

  await page.getByRole('button', { name: 'About us' }).click()
  await expect(page).toHaveURL(/how-it-works/)
  await expect(page.getByRole('heading', { name: /private path/i })).toBeVisible()

  await page.getByRole('button', { name: 'Join Belong' }).click()
  await expect(page).toHaveURL(/register/)
  await expect(page.getByRole('heading', { name: 'Spark something new' })).toBeVisible()

  await page.getByRole('button', { name: 'Log in' }).last().click()
  await expect(page).toHaveURL(/login/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  await page.getByRole('button', { name: 'Belong home' }).click()
  await expect(page.getByRole('heading', { name: 'Talk to Luna AI' })).toBeVisible()
})

test('authenticated visitors see their home at the site root', async ({ page }) => {
  await page.route('**/api/auth/session/', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )
  await page.route('**/api/profiles/me/', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        user: { id: 1, username: 'maya', first_name: 'Maya', email: '', is_staff: false },
        display_name: 'Maya Chen',
        bio: '',
        location: '',
        phone_number: null,
        phone_verified: true,
        sms_match_notifications: false,
        sms_unread_reminders: false,
        sms_safety_alerts: true,
        connection_goal: 'friendship',
        values: [],
        interests: [],
        communication_style: '',
        life_goals: [],
        lifestyle: [],
        deal_breakers: [],
        is_discoverable: true,
        is_18_or_older: true,
        terms_version: '',
        terms_accepted_at: null,
        guidelines_accepted_at: null,
        ai_profile_consent: false,
        ai_summary: '',
        ai_traits: [],
        ai_analysis_status: 'complete',
        onboarding_complete: true,
        gender: 'female',
        gender_preference: 'both',
        is_premium: false,
      }),
    }),
  )
  await page.route('**/api/matches/', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/api/conversations/', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/api/notifications/', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Maya/ })).toBeVisible()
  await expect(page).toHaveURL('/')
})
