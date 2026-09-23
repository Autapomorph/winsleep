use semver::Version;
use tauri_plugin_updater::RemoteRelease;

/// Determines whether the application should update to `remote_version`.
///
/// Follows Semantic Versioning 2.0.0 precedence rules:
/// - Numeric pre-releases: `1.2.3-1 < 1.2.3-2`
/// - Numeric vs alphanumeric: `1.2.3-1 < 1.2.3-alpha.1`
/// - Pre-release phases: `1.2.3-alpha.1 < 1.2.3-alpha.2 < 1.2.3-beta.1 < 1.2.3-rc.1`
/// - Final release vs pre-release: `1.2.3-rc.1 < 1.2.3` and `1.2.3-1 < 1.2.3`
/// - Protection: a stable release (`1.2.3`) will not accept `1.2.3-beta.1` or `1.2.3-1`
pub fn should_update(current: &Version, remote: &Version) -> bool {
    // If the base version (major.minor.patch) is identical:
    // A stable version (without pre-release) should never be replaced by a pre-release of the same base.
    if current.pre.is_empty()
        && !remote.pre.is_empty()
        && (current.major, current.minor, current.patch)
            == (remote.major, remote.minor, remote.patch)
    {
        return false;
    }

    remote > current
}

/// Version comparator callback for `tauri_plugin_updater::Builder::default_version_comparator`.
pub fn version_comparator(current: Version, remote: RemoteRelease) -> bool {
    should_update(&current, &remote.version)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    fn parse_v(s: &str) -> Version {
        Version::from_str(s).expect("valid semver string")
    }

    #[test]
    fn test_numeric_prereleases_increment() {
        // 1. 1.2.3-1 < 1.2.3-2 (1.2.3-2 is newer)
        let v1 = parse_v("1.2.3-1");
        let v2 = parse_v("1.2.3-2");
        assert!(should_update(&v1, &v2));
        assert!(!should_update(&v2, &v1));
    }

    #[test]
    fn test_numeric_vs_alphanumeric_prerelease() {
        // 2. 1.2.3-1 < 1.2.3-alpha.1 (alphanumeric identifier is higher precedence than numeric)
        let v_num = parse_v("1.2.3-1");
        let v_alpha = parse_v("1.2.3-alpha.1");
        assert!(should_update(&v_num, &v_alpha));
        assert!(!should_update(&v_alpha, &v_num));
    }

    #[test]
    fn test_same_phase_prerelease_increment() {
        // 3. 1.2.3-alpha.1 < 1.2.3-alpha.2 (-alpha.2 is newer)
        let v_a1 = parse_v("1.2.3-alpha.1");
        let v_a2 = parse_v("1.2.3-alpha.2");
        assert!(should_update(&v_a1, &v_a2));
        assert!(!should_update(&v_a2, &v_a1));
    }

    #[test]
    fn test_phase_transition_alpha_to_beta() {
        // 4. 1.2.3-alpha.1 < 1.2.3-beta.1 (beta is higher than alpha)
        let v_alpha = parse_v("1.2.3-alpha.1");
        let v_beta = parse_v("1.2.3-beta.1");
        assert!(should_update(&v_alpha, &v_beta));
        assert!(!should_update(&v_beta, &v_alpha));
    }

    #[test]
    fn test_phase_transition_beta_to_rc() {
        // 5. 1.2.3-beta.2 < 1.2.3-rc.1 (rc is higher than beta)
        let v_beta = parse_v("1.2.3-beta.2");
        let v_rc = parse_v("1.2.3-rc.1");
        assert!(should_update(&v_beta, &v_rc));
        assert!(!should_update(&v_rc, &v_beta));
    }

    #[test]
    fn test_prerelease_to_stable_final_release() {
        // 6. 1.2.3-rc.1 < 1.2.3 and 1.2.3-1 < 1.2.3
        let v_stable = parse_v("1.2.3");
        let v_rc = parse_v("1.2.3-rc.1");
        let v_num = parse_v("1.2.3-1");

        assert!(should_update(&v_rc, &v_stable));
        assert!(should_update(&v_num, &v_stable));
    }

    #[test]
    fn test_prerelease_of_higher_base_version() {
        // 7. 1.2.4-alpha.1 > 1.2.3 (base version is higher)
        let v_old_stable = parse_v("1.2.3");
        let v_next_alpha = parse_v("1.2.4-alpha.1");
        assert!(should_update(&v_old_stable, &v_next_alpha));
    }

    #[test]
    fn test_stable_safeguard_rejects_prerelease_of_same_base() {
        // 8. Stable client on 1.2.3 should NOT update to 1.2.3-beta.1 or 1.2.3-1
        let v_stable = parse_v("1.2.3");
        let v_beta = parse_v("1.2.3-beta.1");
        let v_num = parse_v("1.2.3-1");

        assert!(!should_update(&v_stable, &v_beta));
        assert!(!should_update(&v_stable, &v_num));
    }

    #[test]
    fn test_equal_versions_no_update() {
        let v1 = parse_v("1.2.3");
        let v2 = parse_v("1.2.3");
        assert!(!should_update(&v1, &v2));

        let v_pre1 = parse_v("1.2.3-beta.1");
        let v_pre2 = parse_v("1.2.3-beta.1");
        assert!(!should_update(&v_pre1, &v_pre2));
    }
}
