import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@respond/lib/client/store';
import { ActivityActions } from '@respond/lib/state';
import { Activity, ResponderStatus } from '@respond/types/activity';
import { useState } from 'react';
import { SplitButton } from './SplitButton';

const options = [
  { id: ResponderStatus.Unavailable, text: 'Not Available' },
  { id: ResponderStatus.Standby, text: 'Stand By' },
  { id: ResponderStatus.Responding, text: 'Respond' },
  { id: ResponderStatus.Cleared, text: 'Clear' },
]

function getRecommendedAction(current: ResponderStatus|undefined, startTime: number): ResponderStatus {
  const now = new Date().getTime();
  if (current === ResponderStatus.Responding) {
    return ResponderStatus.Cleared;
  }
  if (startTime - 60 * 60 * 1000 > now) {
    return ResponderStatus.Standby;
  }
  return ResponderStatus.Responding;
}

export const StatusUpdater = ({activity, current}: {activity: Activity, current?: ResponderStatus}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.userInfo);
  const thisOrg = useAppSelector(state => state.organization.mine);
  
  const [ confirming, setConfirming ] = useState<boolean>(false);
  const [ confirmTitle, setConfirmTitle ] = useState<string>('');
  const [ confirmActivity, setConfirmActivity ] = useState<Activity>();
  const [ confirmActionText, setConfirmActionText ] = useState<string>('Respond');

  if (!user) {
    return <></>;
  }

  current = current ?? activity.participants[user.userId]?.timeline[0]?.status;

  function confirmPrompt(title: string, actionText: string, activity: Activity) {
    setConfirmTitle(title);
    setConfirmActionText(actionText);
    setConfirmActivity(activity);
    setConfirming(true);
  }

  function finishPrompt(confirm: boolean) {
    setConfirming(false);
    if (confirm /* typescript asserts ->> */&& confirmActivity && user && thisOrg) {
      dispatch(ActivityActions.participantUpdate(
        confirmActivity.id,
        user.userId,
        user.given_name ?? '',
        user.family_name ?? '',
        thisOrg.id,
        new Date().getTime(),
        ResponderStatus.Responding,
      ));
    }
  }

  return (
    <>
      <SplitButton options={options} selected={getRecommendedAction(current, activity.startTime)} onClick={(newStatus) => { confirmPrompt('abc', 'asdf', activity)}} />
      <Dialog
        open={confirming}
        onClose={() => finishPrompt(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do the thing for {confirmActivity?.title}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => finishPrompt(false)}>Cancel</Button>
          <Button onClick={() => finishPrompt(true)} autoFocus>{confirmActionText}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

