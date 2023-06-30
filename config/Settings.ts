import {
  ISetting,
  ISettingSelectValue,
  SettingType,
} from '@rocket.chat/apps-engine/definition/settings';

export enum SettingId {
  XAuthToken = 'x_auth_token',
  XUserId = 'x_user_id',
  HideEditionQuickResponses ='hide_edit_quick_responses'
}
export const settings: Array<ISetting> = [
	{
		id: SettingId.HideEditionQuickResponses,
		public: true,
		type: SettingType.BOOLEAN,
		packageValue: true,
		value: true,
		i18nLabel: 'Habilitar responses editables',
		required: false,
	},
	{
		id: SettingId.XUserId,
		type: SettingType.STRING,
		packageValue: '',
		required: true,
		public: false,
		i18nLabel: 'X-User-Id',
	},
	{
		id: SettingId.XAuthToken,
		type: SettingType.STRING,
		packageValue: '',
		required: true,
		public: false,
		i18nLabel: 'X-Auth-Token',
	}

]
