import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';
import { FaGear } from 'react-icons/fa6';

export const SettingsButton = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Button
      isIconOnly
      variant="secondary"
      onPress={() => navigate('/settings')}
      aria-label={t($ => $.settings.openSettingsBtn.aria.label)}
    >
      <FaGear />
    </Button>
  );
};
