require "spec_helper"
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
abort("The Rails environment is running in production mode!") if Rails.env.production?
require "rspec/rails"
require "database_cleaner/mongoid"

RSpec.configure do |config|
  config.use_active_record = false
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!

  config.include FactoryBot::Syntax::Methods

  # Use DatabaseCleaner to ensure a clean state between tests
  config.before(:suite) do
    DatabaseCleaner[:mongoid].strategy = :deletion
    DatabaseCleaner[:mongoid].clean_with(:deletion)
  end

  config.around(:each) do |example|
    DatabaseCleaner[:mongoid].cleaning { example.run }
  end
end
